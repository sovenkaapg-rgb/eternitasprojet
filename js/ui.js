import { Storage } from './storage.js';
import { renderComicComments } from './comments.js';
import { DOM, showGameAlert } from './ui-dom.js';
import { createChapterWidget, createStampsCounterElement, SUPABASE_STORAGE_URL } from './ui-widgets.js';

export { DOM, showGameAlert };

export function getLatestValue(stages, fallback) {
    if (!stages || !Array.isArray(stages)) return fallback || "";
    const found = stages.reduceRight((acc, stage) =>
        acc || ((!stage.page || Storage.isPageRead(stage.page)) ? stage.text : null), null);
    return found || fallback || "";
}

export function renderTitle(index, mangaUniverse, chapterMarks = []) {
    if (!mangaUniverse?.length) return;
    const titleData = mangaUniverse[index];
    const isLocked = titleData.is_locked && !Storage.isTitleUnlocked(titleData.folder);

    if (DOM.siteBackground) {
        DOM.siteBackground.style.backgroundImage = `url('${SUPABASE_STORAGE_URL}/${titleData.folder}/cover.webp')`;
    }
    if (DOM.titleName) DOM.titleName.textContent = isLocked ? `🔒 ${titleData.name}` : titleData.name;
    if (DOM.titleSynopsis) DOM.titleSynopsis.textContent = isLocked ? `ЛОКАЦИЯ ЗАБЛОКИРОВАНА. Ищите сюжетные подсказки.` : titleData.synopsis;
    if (DOM.descriptionZone && titleData.font_family) DOM.descriptionZone.style.fontFamily = `'${titleData.font_family}', sans-serif`;

    DOM.chaptersContainer.innerHTML = isLocked ? `<div class="lock-notice">НЕ ДОСТАТОЧНО ИНФОРМАЦИИ ДЛЯ ДОСТУПА</div>` : "";
    if (isLocked) return;

    const fragment = document.createDocumentFragment();
    const chaptersList = titleData.chapters || [];
    const matchedStamp = chapterMarks.find(m => m.title_folder === titleData.folder);

    chaptersList.forEach((chapter, chIdx) => {
        const widget = createChapterWidget(chapter, chIdx, titleData.folder, matchedStamp);
        fragment.appendChild(widget);
    });

    DOM.chaptersContainer.appendChild(fragment);
}

export function updateArchiveDocuments(currentTitleIndex, mangaUniverse, database, isArtifacts = false, isChat = false, chapterMarks = []) {
    if (!DOM.documentsGrid) return;

    DOM.documentsGrid.innerHTML = "";
    const counterBlock = createStampsCounterElement(mangaUniverse, chapterMarks);
    DOM.documentsGrid.appendChild(counterBlock);

    if (isChat) {
        const curFolder = mangaUniverse[currentTitleIndex]?.folder;
        if (curFolder) renderComicComments(DOM.documentsGrid, curFolder);
        return;
    }

    if (!database || database.length === 0) {
        DOM.documentsGrid.insertAdjacentHTML('beforeend', `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`);
        return;
    }

    const curFolder = mangaUniverse[currentTitleIndex]?.folder;
    const filtered = database.filter(item => item.title_folder === curFolder);

    if (filtered.length === 0) {
        DOM.documentsGrid.insertAdjacentHTML('beforeend', `<div class="doc-details" style="padding:10px; text-align: center;">Находок в этой локации пока нет.</div>`);
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

            const avatarFilename = item.avatar ? item.avatar.replace('imgR/', '') : '';
            const correctAvatarPath = item.avatar ? `${SUPABASE_STORAGE_URL}/imgR/${avatarFilename}` : '';

            div.innerHTML = `
                <div class="doc-card-layout">
                    ${item.avatar ? `<img src="${correctAvatarPath}" class="doc-avatar" alt="avatar" onerror="this.src=''; this.className='doc-avatar silhouette'; this.parentNode.replaceChild(document.createTextNode('?'), this);">` : '<div class="doc-avatar silhouette">?</div>'}
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
