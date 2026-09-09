import { fetchDatabases } from './api.js';
import { Storage } from './storage.js';
import { DOM, renderTitle, updateArchiveDocuments } from './ui.js';
import { handleReadingScroll } from './core.js';
//import { initSiteCounter } from './counter.js';

const State = {
    mangaUniverse: [],
    archiveLoreDatabase: [],
    archiveArtifactsDatabase: [],
    currentTitleIndex: parseInt(localStorage.getItem('last_title_index')) || 0,  // ← Загружаем из памяти
    activeChapterData: null,
    isClosing: false
};

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Загружаем базы данных из Supabase
        const data = await fetchDatabases();
        State.mangaUniverse = data.universeData;
        State.archiveLoreDatabase = data.loreData;
        State.archiveArtifactsDatabase = data.artifactsData;

        // 2. Запуск скрытого счётчика
        //await initSiteCounter();

        // 3. Инициализируем статусы скрытых комиксов
        for (let i = 0, len = State.mangaUniverse.length; i < len; i++) {
            const t = State.mangaUniverse[i];
            const key = `manga_unlocked_${t.folder}`;
            if (t.is_locked && !localStorage.getItem(key)) {
                Storage.setTitleUnlocked(t.folder, "false");
            }
        }

        // 4. Отрисовываем интерфейс
        renderTitle(State.currentTitleIndex, State.mangaUniverse);
        initInteractivity();

    } catch (err) {
        console.error("Ошибка инициализации приложения:", err);
        if (DOM.titleName) DOM.titleName.textContent = "Ошибка загрузки";
    }
});

function initInteractivity() {
    let activeTab = "lore";

    if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", () => {
              State.currentTitleIndex = (State.currentTitleIndex - 1 + State.mangaUniverse.length) % State.mangaUniverse.length;
              localStorage.setItem('last_title_index', State.currentTitleIndex);  // ← Сохраняем
    renderTitle(State.currentTitleIndex, State.mangaUniverse);
});
if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", () => {
    State.currentTitleIndex = (State.currentTitleIndex + 1) % State.mangaUniverse.length;
    localStorage.setItem('last_title_index', State.currentTitleIndex);  // ← Сохраняем
    renderTitle(State.currentTitleIndex, State.mangaUniverse);
});

    // Клик по главе → открытие читалки
    if (DOM.chaptersContainer) {
        DOM.chaptersContainer.addEventListener("click", (e) => {
            const w = e.target.closest(".comic-widget");
            if (!w) return;

            const titleData = State.mangaUniverse[State.currentTitleIndex];
            const totalPages = parseInt(w.dataset.pages);
            DOM.pagesContainer.innerHTML = "";
            const fragment = document.createDocumentFragment();
            const basePath = w.dataset.path;

            for (let i = 1; i <= totalPages; i++) {
                const img = document.createElement("img");
                img.src = `${basePath}/${String(i).padStart(2, '0')}.webp`;
                img.className = "manga-page";
                fragment.appendChild(img);
            }
            
            // Добавь этот блок после обработчика скролла читалки:
if (DOM.closeReaderBtn) {
    DOM.closeReaderBtn.addEventListener("click", () => {
        DOM.reader.classList.remove("active");
        setTimeout(() => {
            DOM.pagesContainer.innerHTML = "";
            if (DOM.progressFill) {
                DOM.progressFill.style.width = "0%";
            }
            State.activeChapterData = null;
        }, 400);
    });
}
            
            
            DOM.pagesContainer.appendChild(fragment);
            DOM.pagesContainer.style.filter = (titleData.folder === "ChernoeBoloto")
                ? "blur(0.3px) drop-shadow(1.5px 0px 0px rgba(255,0,0,0.35)) drop-shadow(-1.5px 0px 0px rgba(0,0,255,0.35))"
                : "none";

            DOM.reader.classList.add("active");
            DOM.reader.scrollTo(0, 0);

            // Сохраняем данные текущей главы для отслеживания прогресса
            const chIdx = parseInt(w.dataset.chIndex);
            State.activeChapterData = titleData.chapters[chIdx];
        });
    }

    // Скролл в читалке → отслеживание прогресса
    if (DOM.reader) {
        let isScrollingToken = false;
        DOM.reader.addEventListener("scroll", () => {
            if (isScrollingToken) return;
            isScrollingToken = true;
            window.requestAnimationFrame(() => {
                handleReadingScroll(State);
                isScrollingToken = false;
            });
        });
    }

    // Открытие архива (ОДИН обработчик)
    if (DOM.archiveEyeBtn && DOM.archiveSidebar) {
        DOM.archiveEyeBtn.addEventListener("click", () => {
            DOM.archiveSidebar.classList.add("open");
            if (DOM.archiveIndicator) DOM.archiveIndicator.style.display = "none";

            if (activeTab === "chat") {
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true);
            } else {
                const currentDb = (activeTab === "lore") 
                    ? State.archiveLoreDatabase 
                    : State.archiveArtifactsDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, activeTab === "artifacts", false);
            }
        });
    }

    // Переключение вкладок архива
    const tabButtons = document.querySelectorAll(".archive-tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.dataset.tab;

            if (activeTab === "chat") {
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true);
            } else {
                const isArtifacts = (activeTab === "artifacts");
                const currentDb = isArtifacts 
                    ? State.archiveArtifactsDatabase 
                    : State.archiveLoreDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, isArtifacts, false);
            }
        });
    });

    // Закрытие архива
    if (DOM.closeArchiveBtn && DOM.archiveSidebar) {
        DOM.closeArchiveBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            DOM.archiveSidebar.classList.remove("open");
        });
    }

    // Сброс прогресса по F4
    window.addEventListener("keydown", (e) => {
        if (e.key === "F4") {
            Storage.clearAll();
            alert("ВСЕ ЗАБЫТО!");
            window.location.reload();
        }
    });
}