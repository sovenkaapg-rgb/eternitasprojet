document.addEventListener("DOMContentLoaded", () => {
    let mangaUniverse = [], archiveLoreDatabase = [], currentTitleIndex = 0, activeChapterData = null, isSecondReading = false, isClosing = false;

    const titleName = document.getElementById("current-title-name"), titleSynopsis = document.getElementById("current-title-synopsis"),
          chaptersContainer = document.getElementById("chapters-list-container"), portalScreen = document.getElementById("portal-screen"),
          reader = document.getElementById("comic-reader"), pagesContainer = document.getElementById("reader-pages-container"),
          siteBackground = document.querySelector(".bg"), prevBtn = document.getElementById("prev-title-btn"), nextBtn = document.getElementById("next-title-btn"),
          gameAlert = document.getElementById("game-alert"), gameAlertText = document.getElementById("game-alert-text"),
          engagementBar = document.getElementById("engagement-bar"), engagementFill = document.getElementById("engagement-fill"),
          archiveEyeBtn = document.getElementById("archive-eye-btn"), archiveSidebar = document.getElementById("archive-sidebar"),
          closeArchiveBtn = document.getElementById("close-archive-btn"), documentsGrid = document.getElementById("documents-grid"),
          statChaptersRead = document.getElementById("stat-chapters-read"), statEngagement = document.getElementById("stat-engagement");

    let gameAlertTimeout = null;

    // Функция красивого всплывающего уведомления в углу
    function showGameAlert(text) {
        const alertElement = document.getElementById("game-alert");
        const alertTextElement = document.getElementById("game-alert-text");
        if (!alertElement || !alertTextElement) return;
        
        alertTextElement.textContent = text;
        if (gameAlertTimeout) clearTimeout(gameAlertTimeout);
        alertElement.classList.add("show");

        gameAlertTimeout = setTimeout(() => { alertElement.classList.remove("show"); }, 5000);
    }

    // Автоматическое скачивание баз данных
    Promise.all([
        fetch('titles.json').then(res => res.json()),
        fetch('char.json').then(res => res.json())
    ]).then(([universeData, loreData]) => {
        mangaUniverse = universeData; 
        archiveLoreDatabase = loreData;
        
        // Регистрируем закрытые тайтлы в памяти браузера
        mangaUniverse.forEach(t => { 
            if (t.isLocked && !localStorage.getItem(`manga_unlocked_${t.folder}`)) {
                localStorage.setItem(`manga_unlocked_${t.folder}`, "false"); 
            }
        });
        renderTitle(currentTitleIndex); 
        initInteractivity();
    }).catch(err => { console.error(err); if (titleName) titleName.textContent = "Ошибка JSON"; });
    // Функция сборки интерфейса комиксов на главном экране
    function renderTitle(index) {
        if (mangaUniverse.length === 0) return;
        const titleData = mangaUniverse[index];
        
        if (siteBackground) { 
            siteBackground.style.backgroundImage = `url('${titleData.folder}/cover.webp')`; 
            siteBackground.style.backgroundSize = "cover"; 
            siteBackground.style.backgroundPosition = "center"; 
        }
        
        if (titleData.isLocked) {
            titleData.isLocked = localStorage.getItem(`manga_unlocked_${titleData.folder}`) !== "true"; 
        }
        
        if (titleName) titleName.textContent = titleData.isLocked ? `🔒 ${titleData.name}` : titleData.name;
        if (titleSynopsis) titleSynopsis.textContent = titleData.isLocked ? `ЛОКАЦИЯ ЗАБЛОКИРОВАНА. Ищите сюжетные подсказки.` : titleData.synopsis;
        
        const dz = document.querySelector(".title-description-zone");
        if (dz && titleData.fontFamily) dz.style.fontFamily = `'${titleData.fontFamily}', sans-serif`;
        
        chaptersContainer.innerHTML = "";
        if (titleData.isLocked) {
            const m = document.createElement("div"); m.className = "lock-notice"; m.textContent = "НЕ ДОСТАТОЧНО ИНФОРМАЦИИ ДЛЯ ДОСТУПА"; chaptersContainer.appendChild(m); return;
        }
        
        titleData.chapters.forEach((chapter, chIdx) => {
            const w = document.createElement("div"); w.className = "comic-widget"; 
            const cp = `${titleData.folder}/${chapter.id}`;
            w.style.backgroundImage = `linear-gradient(90deg, rgba(43,24,43,0.59) 0%, rgba(44,32,60,0.66) 100%), url('${cp}/cover.webp')`;
            w.dataset.path = cp; w.dataset.pages = chapter.pagesCount; w.dataset.chIndex = chIdx;
            w.innerHTML = `<img src="${cp}/cover.webp" alt="Обложка"><div class="widget-info"><h2 class="comic-title">${titleData.name}</h2><span class="chapter-number">${chapter.displayNum}</span></div><div class="chapter-preview"></div>`;
            chaptersContainer.appendChild(w);
            
           const pContainer = w.querySelector(".chapter-preview"), pCount = Math.min(chapter.pagesCount, 3);
           for (let i = 1; i <= pCount; i++) {
                const img = document.createElement("img"); 
                img.src = `${cp}/${String(i).padStart(2, '0')}.webp`
                img.style.zIndex = pCount - (i - 1); 
                pContainer.appendChild(img);
           }
        });
    }

    // Инициализация кликов по стрелкам, виджетам и скролла читалки
    function initInteractivity() {
        if (prevBtn) prevBtn.addEventListener("click", () => { currentTitleIndex = (currentTitleIndex - 1 + mangaUniverse.length) % mangaUniverse.length; renderTitle(currentTitleIndex); });
        if (nextBtn) nextBtn.addEventListener("click", () => { currentTitleIndex = (currentTitleIndex + 1) % mangaUniverse.length; renderTitle(currentTitleIndex); });
        
        if (chaptersContainer) {
            chaptersContainer.addEventListener("click", (e) => {
                const w = e.target.closest(".comic-widget"); if (!w) return;
                activeChapterData = mangaUniverse[currentTitleIndex].chapters[parseInt(w.dataset.chIndex)];
                isSecondReading = localStorage.getItem(`manga_unlocked_${mangaUniverse[currentTitleIndex].folder}`) === "true";
                
            pagesContainer.innerHTML = "";
                for (let i = 1; i <= parseInt(w.dataset.pages); i++) {
                const img = document.createElement("img"); 
                img.src = `${w.dataset.path}/${String(i).padStart(2, '0')}.webp`;
                img.className = "manga-page"; 
                pagesContainer.appendChild(img);
                }

        if (isSecondReading && engagementBar) { 
                    engagementFill.style.width = "0%"; 
                    engagementBar.style.opacity = "1"; 
                } // <-- Закрыли маленькое условие градусника

                // Проверяем, какой тайтл сейчас открыт
                const curFolder = mangaUniverse[currentTitleIndex].folder;

                if (curFolder === "ChernoeBoloto") {
                    // Если это Черное Болото, накладываем уникальный стиль аберрации и размытия
                    pagesContainer.style.filter = "blur(0.3px) drop-shadow(1.5px 0px 0px rgba(255,0,0,0.35)) drop-shadow(-1.5px 0px 0px rgba(0,0,255,0.35))";
                } else {
                    // Для ВСЕХ остальных комиксов очищаем фильтры, оставляя картинку чистой
                    pagesContainer.style.filter = "none";
                }

                reader.classList.add("active"); 
                reader.scrollTo(0, 0);
            }); // <-- Закрыли само событие клика по виджету
        } // <-- Закрыли проверку существования chaptersContainer

        // 🔄 УМНЫЙ СКРОЛЛ: Высчитывает страницу и сравнивает с char.json
        if (reader) {
            reader.addEventListener("scroll", () => {
                if (!activeChapterData) return;
                const pct = reader.scrollTop / (reader.scrollHeight - reader.clientHeight);
                const curPage = Math.floor(pct * activeChapterData.pagesCount) + 1;

                if (isSecondReading && engagementFill) engagementFill.style.width = `${Math.min(Math.round(pct * 100), 100)}%`;
                if (statEngagement) statEngagement.textContent = `${Math.min(Math.round(pct * 100), 100)}%`;

                const curFolder = mangaUniverse[currentTitleIndex].folder;
                
                // Авто-генерация уникального ключа для текущей страницы
                const pageProgressKey = `${curFolder}_${activeChapterData.id}_p${curPage}`;

                if (localStorage.getItem(pageProgressKey) !== "true") {
                    localStorage.setItem(pageProgressKey, "true"); 

let dataUpdated = false;
let alertMessage = "Архив обновлен!";
let isTitleUnlockEvent = false; // Флаг: открылся ли целый тайтл

// 1. Проверяем, открывает ли эта страница другой комикс
mangaUniverse.forEach(title => {
    if (title.isLocked && title.unlocksAt === pageProgressKey) {
        localStorage.setItem(`manga_unlocked_${title.folder}`, "true");
        alertMessage = `Открыт доступ к разделу '${title.name}'!`;
        dataUpdated = true;
        isTitleUnlockEvent = true; // Фиксируем приоритет для тайтла
    }
});

// 2. Проверяем персонажей (только если не сработало уведомление о новом тайтле)
archiveLoreDatabase.forEach(char => {
    if (char.titleFolder === curFolder) {
        // Открытие секретного персонажа с нуля
        if (char.isSecret && char.unlockPage === pageProgressKey) {
            dataUpdated = true;
            if (!isTitleUnlockEvent) {
                alertMessage = `Новый персонаж: ${char.nameStages ? char.nameStages[0].text : char.name}!`;
            }
        }
        // Проверка скрытых этапов биографии и данных
        const checkArray = [char.nameStages, char.typeStages, char.statusStages, char.biographyStages];
        checkArray.forEach(arr => {
            if (arr && Array.isArray(arr)) {
                arr.forEach(stage => {
                    if (stage.page === pageProgressKey) {
                        dataUpdated = true;
                        if (!isTitleUnlockEvent) {
                            alertMessage = `Данные Архива обновлены!`;
                        }
                    }
                });
            }
        });
    }
});

// 3. Вызов самого уведомления, если что-то обновилось
if (dataUpdated) {
    if (document.getElementById("archive-indicator")) {
        document.getElementById("archive-indicator").style.display = "block";
    }
    showGameAlert(alertMessage);
    renderTitle(currentTitleIndex);
}

                }

                if (isClosing) return;
                if (reader.scrollHeight - (reader.scrollTop + reader.clientHeight) <= 40) {
                    isClosing = true; reader.classList.remove("active"); if (engagementBar) engagementBar.style.opacity = "0";
                    setTimeout(() => { pagesContainer.innerHTML = ""; isClosing = false; activeChapterData = null; }, 400);
                }
            });
        }
        // Логика кнопки открытия Архива
        if (archiveEyeBtn && archiveSidebar) {
            archiveEyeBtn.addEventListener("click", () => {
                archiveSidebar.classList.add("open"); 
                if (document.getElementById("archive-indicator")) {
                    document.getElementById("archive-indicator").style.display = "none";
                }
                let count = 0; 
                mangaUniverse.forEach(t => { 
                    if (localStorage.getItem(`manga_unlocked_${t.folder}`) === "true") count++; 
                });
                if (statChaptersRead) statChaptersRead.textContent = count; 
                updateArchiveDocuments();
            });
        }
        
        if (closeArchiveBtn && archiveSidebar) {
            closeArchiveBtn.addEventListener("click", () => { archiveSidebar.classList.remove("open"); });
        }
    }

    // Динамическая генерация карточек Архива под любые изменения по ходу чтения
    function updateArchiveDocuments() {
        if (!documentsGrid || archiveLoreDatabase.length === 0) return;
        documentsGrid.innerHTML = ""; 
        
        const curFolder = mangaUniverse[currentTitleIndex].folder;
        const filtered = archiveLoreDatabase.filter(item => item.titleFolder === curFolder);
        
        if (filtered.length === 0) {
            documentsGrid.innerHTML = `<div class="doc-details" style="padding:10px;">Досье ещё не заведены.</div>`;
            return;
        }

        // Вспомогательная функция для выбора самой свежей открытой стадии текста
        function getLatestValue(stagesArray, fallbackValue) {
            if (!stagesArray || !Array.isArray(stagesArray)) return fallbackValue || "";
            let currentText = "";
            stagesArray.forEach(stage => {
                // Если стадия базовая (page: 0 или не указан), либо страница уже прочитана
                if (stage.page === 0 || !stage.page) {
                    currentText = stage.text; 
                } else if (localStorage.getItem(stage.page) === "true") {
                    currentText = stage.text; // Перезаписываем новым открытым значением
                }
            });
            return currentText;
        }

        filtered.forEach(item => {
            // Карточка видима, если она не секретная ИЛИ прочитана страница её открытия
            let isVisible = !item.isSecret;
            if (item.isSecret && item.unlockPage) {
                isVisible = localStorage.getItem(item.unlockPage) === "true";
            }

            const div = document.createElement("div");
            
            if (isVisible) {
                div.className = "doc-item unlocked";
                
                // Извлекаем актуальные данные на основе прочитанных страниц
                const currentName = getLatestValue(item.nameStages, item.name);
                const currentType = getLatestValue(item.typeStages, item.type);
                const currentStatus = getLatestValue(item.statusStages, "");

                // Собираем биографию (она склеивается из кусочков)
                let bioHTML = "";
                if (item.biographyStages) {
                    item.biographyStages.forEach(stage => {
                        if (stage.page === 0 || !stage.page) {
                            bioHTML += stage.text;
                        } else if (localStorage.getItem(stage.page) === "true") {
                            bioHTML += ` <span style="color:#ff7b00;">[доп.]</span> ${stage.text}`;
                        }
                    });
                }

                div.innerHTML = `
                    <div class="doc-card-layout">
                        <img src="${item.avatar}" class="doc-avatar" alt="avatar">
                        <div class="doc-text-block">
                            <span class="doc-type-tag">${currentType}</span>
                            <h4 class="doc-name">${currentName}</h4>
                            ${currentStatus ? `<p class="doc-details" style="color: #ffaa00; font-weight: bold; margin-bottom: 4px;">${currentStatus}</p>` : ''}
                            <p class="doc-details">${bioHTML}</p>
                        </div>
                    </div>
                `;
            } else {
                // Если персонаж/предмет еще засекречен по сюжету
                div.className = "doc-item locked";
                div.innerHTML = `
                    <div class="doc-card-layout locked-status">
                        <div class="doc-avatar silhouette">🔒</div>
                        <div class="doc-text-block">
                            <span class="doc-type-tag" style="color: #ff3b30;">ДАННЫЕ СКРЫТЫ</span>
                            <h4 class="doc-name">???</h4>
                            <p class="doc-details">Продолжайте чтение для разблокировки информации.</p>
                        </div>
                    </div>
                `;
            }
            documentsGrid.appendChild(div);
        });
    }

    // ХАК-КНОПКА F4 ДЛЯ СБРОСА ТЕСТОВ
    window.addEventListener("keydown", (e) => {
        if (e.key === "F4") {
            localStorage.clear();
            alert("ВСЕ ЗАБЫТО!");
            window.location.reload();
        }
    });

    // Запускаем сборку самого первого тайтла при старте сайта
    renderTitle(currentTitleIndex);
});
