import { Storage } from './storage.js';

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
    const found = stages.reduceRight((acc, stage) => acc || ((!stage.page || Storage.isPageRead(stage.page)) ? stage.text : null), null);
    return found || fallback || "";
}

export function renderTitle(index, mangaUniverse) {
    if (!mangaUniverse?.length) return;
    const titleData = mangaUniverse[index];
    const isLocked = titleData.isLocked && !Storage.isTitleUnlocked(titleData.folder);
    
    // ИСПРАВЛЕНО: Путь к обложке тайтла теперь ведет через папку Titles/
    if (DOM.siteBackground) DOM.siteBackground.style.backgroundImage = `url('Titles/${titleData.folder}/cover.webp')`;
    if (DOM.titleName) DOM.titleName.textContent = isLocked ? `🔒 ${titleData.name}` : titleData.name;
    if (DOM.titleSynopsis) DOM.titleSynopsis.textContent = isLocked ? `ЛОКАЦИЯ ЗАБЛОКИРОВАНА. Ищите сюжетные подсказки.` : titleData.synopsis;
    if (DOM.descriptionZone && titleData.fontFamily) DOM.descriptionZone.style.fontFamily = `'${titleData.fontFamily}', sans-serif`;
    
    DOM.chaptersContainer.innerHTML = isLocked ? `<div class="lock-notice">НЕ ДОСТАТОЧНО ИНФОРМАЦИИ ДЛЯ ДОСТУПА</div>` : "";
    if (isLocked) return;
    
    const fragment = document.createDocumentFragment();
    titleData.chapters.forEach((chapter, chIdx) => {
        const w = document.createElement("div");
        w.className = "comic-widget";
        // ИСПРАВЛЕНО: Путь к главам теперь учитывает вложенность Titles/
        const cp = `Titles/${titleData.folder}/${chapter.id}`;
        
        w.style.backgroundImage = `linear-gradient(90deg, rgba(43,24,43,0.59) 0%, rgba(44,32,60,0.66) 100%), url('${cp}/cover.webp')`;
        w.dataset.path = cp; w.dataset.pages = chapter.pagesCount; w.dataset.chIndex = chIdx;
        
        w.innerHTML = `<img src="${cp}/cover.webp" alt="Обложка">
            <div class="widget-info"><h2 class="comic-title">${titleData.name}</h2><span class="chapter-number">${chapter.displayNum}</span></div>
            <div class="chapter-preview"></div>`;
        
        const previewContainer = w.querySelector(".chapter-preview");
        const pCount = Math.min(chapter.pagesCount, 3);
        let previewHTML = "";
        for (let i = 1; i <= pCount; i++) {
            previewHTML += `<img src="${cp}/${String(i).padStart(2, '0')}.webp" style="z-index: ${pCount - i + 1}">`;
        }
        previewContainer.innerHTML = previewHTML;
        fragment.appendChild(w);
    });
    DOM.chaptersContainer.appendChild(fragment);
}

export function updateArchiveDocuments(currentTitleIndex, mangaUniverse, database, isArtifacts = false) {
    if (!DOM.documentsGrid) return;
    
    // Кристальная очистка экрана перед новым рендером
    DOM.documentsGrid.innerHTML = ""; 
    
    if (!database || database.length === 0) {
        DOM.documentsGrid.innerHTML = `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`;
        return;
    }
    
    const curFolder = mangaUniverse[currentTitleIndex].folder;
    const filtered = database.filter(item => item.titleFolder === curFolder);
    
    if (filtered.length === 0) {
        DOM.documentsGrid.innerHTML = `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(item => {
        const isVisible = !item.isSecret || (item.unlockPage && Storage.isPageRead(item.unlockPage));
        const div = document.createElement("div");
        div.className = `doc-item ${isVisible ? 'unlocked' : 'locked'}`;
        
        if (isVisible) {
            let detailsHTML = "";
            const stages = isArtifacts ? item.descriptionStages : item.biographyStages;
            
            stages?.forEach(stage => {
                if (!stage.page || Storage.isPageRead(stage.page)) {
                    detailsHTML += (!stage.page) ? stage.text : ` <span style="color:#ff7b00;">[доп.]</span> ${stage.text}`;
                }
            });

            
            
            
            
            // ИСПРАВЛЕНО: Путь к аватаркам досье/предметов теперь автоматически перенаправлен в Titles/
            const correctAvatarPath = item.avatar.startsWith('imgR/') ? item.avatar : `imgR/${item.avatar}`;

            div.innerHTML = `
                <div class="doc-card-layout">
                    <img src="${correctAvatarPath}" class="doc-avatar" alt="avatar">
                    <div class="doc-text-block">
                        <span class="doc-type-tag">${isArtifacts ? (item.type || 'Артефакт') : getLatestValue(item.typeStages, item.type)}</span>
                        <h4 class="doc-name">${getLatestValue(item.nameStages, item.name)}</h4>
                        ${!isArtifacts && item.statusStages ? `<p class="doc-details" style="color: #ffaa00; font-weight: bold; margin-bottom: 4px;">${getLatestValue(item.statusStages, "")}</p>` : ''}
                        <p class="doc-details">${detailsHTML}</p>
                    </div>
                </div>`;
        } else {
            div.innerHTML = `
                <div class="doc-card-layout locked-status">
                    <div class="doc-avatar silhouette">🔒</div>
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
