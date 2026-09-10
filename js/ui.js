import { Storage } from './storage.js';
import { renderComicComments } from './comments.js';

// ✅ Убраны все пробелы в ID
export const DOM = {
    titleName: document.getElementById("current-title-name"),
    titleSynopsis: document.getElementById("current-title-synopsis"),
    chaptersContainer: document.getElementById("chapters-list-container"),
    reader: document.getElementById("comic-reader"),
    pagesContainer: document.getElementById("reader-pages-container"),
    siteBackground: document.querySelector(".bg"),
    prevBtn: document.getElementById("prev-title-btn"),
    nextBtn: document.getElementById("next-title-btn"),
    gameAlert: document.getElementById("game-alert-toast") || document.getElementById("game-alert"),
    gameAlertText: document.getElementById("game-alert-text"),
    archiveEyeBtn: document.getElementById("archive-eye-btn"),
    archiveSidebar: document.getElementById("archive-sidebar"),
    closeArchiveBtn: document.getElementById("close-archive-btn"),
    documentsGrid: document.getElementById("documents-grid"),
    archiveIndicator: document.getElementById("archive-indicator"),
    descriptionZone: document.querySelector(".title-description-zone"),
    progressFill: document.getElementById("read-progress-fill"),
    closeReaderBtn: document.getElementById("close-reader-btn")
};

let gameAlertTimeout = null;

export function showGameAlert(text) {
    if (!DOM.gameAlert || !DOM.gameAlertText) return;
    DOM.gameAlertText.textContent = text;
    if (gameAlertTimeout) clearTimeout(gameAlertTimeout);
    DOM.gameAlert.classList.add("show");
    gameAlertTimeout = setTimeout(() => DOM.gameAlert.classList.remove("show"), 5000);
}

export function getLatestValue(stages, fallback) {
    if (!stages || !Array.isArray(stages)) return fallback || "";
    const found = stages.reduceRight((acc, stage) => 
        acc || ((!stage.page || Storage.isPageRead(stage.page)) ? stage.text : null), null);
    return found || fallback || "";
}

export function renderTitle(index, mangaUniverse) {
    if (!mangaUniverse?.length) return;
    const titleData = mangaUniverse[index];
    const isLocked = titleData.is_locked && !Storage.isTitleUnlocked(titleData.folder);

    if (DOM.siteBackground) {
        DOM.siteBackground.style.backgroundImage = `url('Titles/${titleData.folder}/cover.webp')`;
    }
    if (DOM.titleName) {
        DOM.titleName.textContent = isLocked ? `🔒 ${titleData.name}` : titleData.name;
    }
    if (DOM.titleSynopsis) {
        DOM.titleSynopsis.textContent = isLocked 
            ? `ЛОКАЦИЯ ЗАБЛОКИРОВАНА. Ищите сюжетные подсказки.` 
            : titleData.synopsis;
    }
    if (DOM.descriptionZone && titleData.font_family) {
        DOM.descriptionZone.style.fontFamily = `'${titleData.font_family}', sans-serif`;
    }

    DOM.chaptersContainer.innerHTML = isLocked 
        ? `<div class="lock-notice">НЕ ДОСТАТОЧНО ИНФОРМАЦИИ ДЛЯ ДОСТУПА</div>` 
        : "";

    if (isLocked) return;

    const fragment = document.createDocumentFragment();
    const chaptersList = titleData.chapters || [];

    chaptersList.forEach((chapter, chIdx) => {
        const w = document.createElement("div");
        w.className = "comic-widget";
        const cp = `Titles/${titleData.folder}/${chapter.chapter_id_str}`;
        w.style.backgroundImage = `linear-gradient(90deg, rgba(43,24,43,0.59) 0%, rgba(44,32,60,0.66) 100%), url('${cp}/cover.webp')`;
        w.dataset.path = cp;
        w.dataset.pages = chapter.pages_count;
        w.dataset.chIndex = chIdx;
        w.innerHTML = `
            <img src="${cp}/cover.webp" alt="Обложка">
            <div class="widget-info">
                <h2 class="comic-title">${titleData.name}</h2>
                <span class="chapter-number">${chapter.display_num}</span>
            </div>
            <div class="chapter-preview"></div>`;
        
        const previewContainer = w.querySelector(".chapter-preview");
        const pCount = Math.min(chapter.pages_count, 3);
        let previewHTML = "";
        for (let i = 1; i <= pCount; i++) {
            previewHTML += `<img src="${cp}/${String(i).padStart(2, '0')}.webp" style="z-index: ${pCount - i + 1}">`;
        }
        previewContainer.innerHTML = previewHTML;
        fragment.appendChild(w);
    });

    DOM.chaptersContainer.appendChild(fragment);
}

export function updateArchiveDocuments(currentTitleIndex, mangaUniverse, database, isArtifacts = false, isChat = false) {
    if (!DOM.documentsGrid) return;

    DOM.documentsGrid.innerHTML = "";

    if (isChat) {
        const curFolder = mangaUniverse[currentTitleIndex].folder;
        renderComicComments(DOM.documentsGrid, curFolder);
        return;
    }

    if (!database || database.length === 0) {
        DOM.documentsGrid.innerHTML = `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`;
        return;
    }

    const curFolder = mangaUniverse[currentTitleIndex].folder;
    const filtered = database.filter(item => item.title_folder === curFolder);

    if (filtered.length === 0) {
        DOM.documentsGrid.innerHTML = `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(item => {
    const isVisible = !item.is_secret || (item.unlock_page && Storage.isPageRead(item.unlock_page));
    const div = document.createElement("div");
    div.className = `doc-item ${isVisible ? 'unlocked' : 'locked'}`;
    
    if (isVisible) {
        let detailsHTML = "";
        const stages = isArtifacts ? item.description_stages : item.biography_stages;
        
        stages?.forEach(stage => {
            if (!stage.page || Storage.isPageRead(stage.page)) {
                detailsHTML += (!stage.page) ? stage.text : ` <span style="color:#ff7b00;">[доп.]</span> ${stage.text}`;
            }
        });
        
        const correctAvatarPath = item.avatar?.startsWith('imgR/') ? item.avatar : `imgR/${item.avatar}`;
        
        div.innerHTML = `
            <div class="doc-card-layout">
                ${item.avatar ? `<img src="${correctAvatarPath}" class="doc-avatar" alt="avatar">` : '<div class="doc-avatar silhouette">?</div>'}
                <div class="doc-text-block">
                    <span class="doc-type-tag">${isArtifacts ? (item.type || 'Артефакт') : getLatestValue(item.type_stages, item.type)}</span>
                    <h4 class="doc-name">${getLatestValue(item.name_stages, item.name)}</h4>
                    ${!isArtifacts && item.status_stages ? `<p class="doc-details" style="color: #ffaa00; font-weight: bold; margin-bottom: 4px;">${getLatestValue(item.status_stages, "")}</p>` : ''}
                    <p class="doc-details">${detailsHTML}</p>
                </div>
            </div>`;
    } else {
        div.innerHTML = `
            <div class="doc-card-layout locked-status">
                <div class="doc-avatar silhouette"></div>
                <div class="doc-text-block">
                    <span class="doc-type-tag" style="color: #ff3b30;">ДАННЫЕ СКРЫТЫ</span>
                    <h4 class="doc-name">???</h4>
                    <p class="doc-details">Продолжайте чтение для разблокировки информации.</p>
                </div>
            </div>`;
    }
    
    fragment.appendChild(div);
});

    DOM.documentsGrid.appendChild(fragment);
}