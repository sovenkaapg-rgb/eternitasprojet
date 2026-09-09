import { fetchDatabases } from './api.js';
import { Storage } from './storage.js';
import { DOM, renderTitle, updateArchiveDocuments } from './ui.js';
import { handleReadingScroll } from './core.js';
import { initSiteCounter } from './counter.js';


const State = {
    mangaUniverse: [],
    archiveLoreDatabase: [],
    archiveArtifactsDatabase: [],
    currentTitleIndex: 0,
    activeChapterData: null,
    isClosing: false
};

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Загружаем базы данных
        const data = await fetchDatabases();
        State.mangaUniverse = data.universeData;
        State.archiveLoreDatabase = data.loreData;
        State.archiveArtifactsDatabase = data.artifactsData;

        // 2. ЗАПУСК СКРЫТОГО СЧЁТЧИКА
        initSiteCounter();

        // 3. Инициализируем статусы скрытых комиксов
        for (let i = 0, len = State.mangaUniverse.length; i < len; i++) {
            const t = State.mangaUniverse[i];
            const key = `manga_unlocked_${t.folder}`;
            if (t.isLocked && !localStorage.getItem(key)) {
                Storage.setTitleUnlocked(t.folder, "false");
            }
        }

        // 4. Отрисовываем интерфейс и включаем клики
        renderTitle(State.currentTitleIndex, State.mangaUniverse);
        initInteractivity();

    } catch (err) {
        console.error("Ошибка инициализации приложения:", err);
        if (DOM.titleName) DOM.titleName.textContent = "Ошибка JSON";
    }
});



function initInteractivity() {
    let activeTab = "lore"; // Регистрируем активный таб один раз внутри интерактивности

    if (DOM.prevBtn) DOM.prevBtn.addEventListener("click", () => {
        State.currentTitleIndex = (State.currentTitleIndex - 1 + State.mangaUniverse.length) % State.mangaUniverse.length;
        renderTitle(State.currentTitleIndex, State.mangaUniverse);
    });

    if (DOM.nextBtn) DOM.nextBtn.addEventListener("click", () => {
        State.currentTitleIndex = (State.currentTitleIndex + 1) % State.mangaUniverse.length;
        renderTitle(State.currentTitleIndex, State.mangaUniverse);
    });

    if (DOM.chaptersContainer) {
        DOM.chaptersContainer.addEventListener("click", (e) => {
            const w = e.target.closest(".comic-widget");
            if (!w) return;

            const titleData = State.mangaUniverse[State.currentTitleIndex];
            State.activeChapterData = titleData.chapters[parseInt(w.dataset.chIndex)];

            DOM.pagesContainer.innerHTML = "";
            const fragment = document.createDocumentFragment();
            const totalPages = parseInt(w.dataset.pages);
            const basePath = w.dataset.path; // Сюда ui.js уже подложил правильный путь Titles/

            for (let i = 1; i <= totalPages; i++) {
                const img = document.createElement("img");
                img.src = `${basePath}/${String(i).padStart(2, '0')}.webp`;
                img.className = "manga-page";
                fragment.appendChild(img);
            }
            DOM.pagesContainer.appendChild(fragment);

            DOM.pagesContainer.style.filter = (titleData.folder === "ChernoeBoloto")
                ? "blur(0.3px) drop-shadow(1.5px 0px 0px rgba(255,0,0,0.35)) drop-shadow(-1.5px 0px 0px rgba(0,0,255,0.35))"
                : "none";

            DOM.reader.classList.add("active");
            DOM.reader.scrollTo(0, 0);
        });
    }

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

    // ИСПРАВЛЕНО: Чистая логика открытия Архива без дубликатов кода
    if (DOM.archiveEyeBtn && DOM.archiveSidebar) {
        DOM.archiveEyeBtn.addEventListener("click", () => {
            DOM.archiveSidebar.classList.add("open");
            if (DOM.archiveIndicator) DOM.archiveIndicator.style.display = "none";
            const currentDb = (activeTab === "lore") ? State.archiveLoreDatabase :State.archiveArtifactsDatabase;
            updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, activeTab === "artifacts");
        });
    }

        // Обновленная логика переключения вкладок (включая Чат)
    const tabButtons = document.querySelectorAll(".archive-tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            activeTab = btn.dataset.tab;
            
            if (activeTab === "chat") {
                // Если выбрали чат, передаем особый флаг в ui.js
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true);
            } else {
                const isArtifacts = (activeTab === "artifacts");
                const currentDb = isArtifacts ? State.archiveArtifactsDatabase : State.archiveLoreDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, isArtifacts, false);
            }
        });
    });


       if (DOM.archiveEyeBtn && DOM.archiveSidebar) {
        DOM.archiveEyeBtn.addEventListener("click", () => {
            DOM.archiveSidebar.classList.add("open");
            if (DOM.archiveIndicator) DOM.archiveIndicator.style.display = "none";

            if (activeTab === "chat") {
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true);
            } else {
                const currentDb = (activeTab === "lore") ? State.archiveLoreDatabase : State.archiveArtifactsDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, activeTab === "artifacts", false);
            }
        });
    }
    
       // Жесткая логика закрытия Архива по клику на крестик
    if (DOM.closeArchiveBtn && DOM.archiveSidebar) {
        DOM.closeArchiveBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Запрещаем клику уходить во фреймы
            DOM.archiveSidebar.classList.remove("open");
        });
    }


    window.addEventListener("keydown", (e) => {
        if (e.key === "F4") {
            Storage.clearAll();
            alert("ВСЕ ЗАБЫТО!");
            window.location.reload();
        }
    });
}
