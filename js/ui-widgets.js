import { Storage } from './storage.js';

export const SUPABASE_STORAGE_URL = "https://tbjxlennbadvkevuyanf.supabase.co/storage/v1/object/public/comic-assets";

// Компонент виджета главы с веером из 3 страниц
export function createChapterWidget(chapter, chIdx, folder, matchedStamp) {
    const w = document.createElement("div");
    w.className = "comic-widget";
    const cp = `${SUPABASE_STORAGE_URL}/${folder}/${chapter.chapter_id_str}`;

    w.style.backgroundImage = `linear-gradient(90deg, rgba(43,24,43,0.59) 0%, rgba(44,32,60,0.66) 100%), url('${cp}/cover.webp')`;
    w.dataset.path = cp;
    w.dataset.pages = chapter.pages_count || 0;
    w.dataset.chIndex = chIdx;

    w.innerHTML = `
        <img src="${cp}/cover.webp" alt="cover" onerror="this.style.display='none'">
        <div class="widget-info">
            <span class="chapter-number">ГЛАВА ${chapter.chapter_id || (chIdx + 1)}</span>
        </div>
        <div class="chapter-preview">
          <img src="${cp}/01.webp" alt="p1" style="z-index: 3; position: relative;" onerror="this.style.display='none'">
          <img src="${cp}/02.webp" alt="p2" style="z-index: 2; position: relative;" onerror="this.style.display='none'">
          <img src="${cp}/03.webp" alt="p3" style="z-index: 1; position: relative;" onerror="this.style.display='none'">
        </div>
    `;

    const firstPageKey = `${folder}_${chapter.chapter_id_str}_p1`;
    if (Storage.isPageRead(firstPageKey) && matchedStamp) {
        const stampDiv = document.createElement("div");
        stampDiv.className = "chapter-stamp";
        stampDiv.style.backgroundImage = `url('${matchedStamp.mark_image}')`;
        stampDiv.style.color = matchedStamp.mark_color || "#ff7b00";
        w.appendChild(stampDiv);
    }

    return w;
}

// Компонент блока со счетчиком полученных печатей
export function createStampsCounterElement(mangaUniverse, chapterMarks) {
    let unlockedStampsHtml = "";
    let totalUnlockedCount = 0;

    mangaUniverse.forEach(title => {
        const matchedStamp = chapterMarks.find(m => m.title_folder === title.folder);
        if (!matchedStamp || !title.chapters) return;

        let titleOpenedChapters = 0;
        const totalChaptersInTitle = title.chapters.length;

        title.chapters.forEach(chapter => {
            const firstPageKey = `${title.folder}_${chapter.chapter_id_str}_p1`;
            if (Storage.isPageRead(firstPageKey)) {
                totalUnlockedCount++;
                titleOpenedChapters++;
            }
        });

        if (titleOpenedChapters > 0) {
            unlockedStampsHtml += `
                <div style="position: relative; display: inline-block; margin-right: 12px; margin-bottom: 8px;" title="${title.name}">
                    <img src="${matchedStamp.mark_image}" 
                         style="width: 32px; height: 32px; object-fit: contain; filter: drop-shadow(0 0 6px ${matchedStamp.mark_color || '#ff7b00'});">
                    <span style="position: absolute; bottom: -4px; right: -4px; background: #000; color: #fff; font-size: 9px; padding: 1px 3px; border-radius: 4px; border: 1px solid ${matchedStamp.mark_color || '#ff7b00'}; font-weight: bold;">
                        ${titleOpenedChapters}/${totalChaptersInTitle}
                    </span>
                </div>`;
        }
    });

    const counterBlock = document.createElement("div");
    counterBlock.className = "stamps-counter-block";
    counterBlock.innerHTML = `
        <div class="stamp-icon">📜</div>
        <div class="stamp-info">
            <span class="stamp-label">Получено печатей: <span class="stamp-count">${totalUnlockedCount}</span></span>
            <div class="stamps-preview-row" style="display: flex; flex-wrap: wrap; margin-top: 8px;">
                ${unlockedStampsHtml || '<span style="color: #666; font-size: 11px;">Нет собранных печатей</span>'}
            </div>
        </div>
    `;
    return counterBlock;
}
