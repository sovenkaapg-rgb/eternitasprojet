import { fetchDatabases, loadChapterMarks } from './api.js';
import { Storage } from './storage.js';
import { DOM, renderTitle, updateArchiveDocuments, renderVideos } from './ui.js';
import { handleReadingScroll } from './core.js';

const State = {
    mangaUniverse: [],
    archiveLoreDatabase: [],
    archiveArtifactsDatabase: [],
    chapterMarks: [],
    currentTitleIndex: 0,
    activeChapterData: null,
    isClosing: false,
    activeView: 'chapters'
};

// ✅ НОВОЕ: Функции для работы с URL
function getFolderFromURL() {
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
        return hash.slice(2); // Убираем '#/'
    }
    return null;
}

function updateURL(folder) {
    if (folder) {
        const newHash = `#/${folder}`;
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        }
    }
}

function findTitleIndexByFolder(folder) {
    return State.mangaUniverse.findIndex(t => t.folder === folder);
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Загружаем базы данных из Supabase
        const data = await fetchDatabases();
        State.mangaUniverse = data.universeData;
        State.archiveLoreDatabase = data.loreData;
        State.archiveArtifactsDatabase = data.artifactsData;
        
        // 2. Загружаем печати глав
        State.chapterMarks = await loadChapterMarks();
        
        // 3. Инициализируем статусы скрытых комиксов
        for (let i = 0, len = State.mangaUniverse.length; i < len; i++) {
            const t = State.mangaUniverse[i];
            const key = `manga_unlocked_${t.folder}`;
            if (t.is_locked && !localStorage.getItem(key)) {
                Storage.setTitleUnlocked(t.folder, "false");
            }
        }
        
        // 4. ✅ НОВОЕ: Определяем начальный тайтл (URL → localStorage → 0)
        const folderFromURL = getFolderFromURL();
        if (folderFromURL) {
            const idx = findTitleIndexByFolder(folderFromURL);
            State.currentTitleIndex = idx >= 0 ? idx : 0;
        } else {
            State.currentTitleIndex = parseInt(localStorage.getItem('last_title_index')) || 0;
        }
        
        // 5. Отрисовываем интерфейс
        renderTitle(State.currentTitleIndex, State.mangaUniverse, State.chapterMarks);
        
        // 6. ✅ НОВОЕ: Устанавливаем URL для текущего тайтла
        const currentTitle = State.mangaUniverse[State.currentTitleIndex];
        if (currentTitle) {
            updateURL(currentTitle.folder);
        }
        
        initInteractivity();
        
        // 7. ✅ НОВОЕ: Обработчик изменения hash (навигация браузера)
        window.addEventListener('hashchange', () => {
            const folder = getFolderFromURL();
            if (folder) {
                const idx = findTitleIndexByFolder(folder);
                if (idx >= 0 && idx !== State.currentTitleIndex) {
                    State.currentTitleIndex = idx;
                    localStorage.setItem('last_title_index', String(State.currentTitleIndex));
                    renderTitle(State.currentTitleIndex, State.mangaUniverse, State.chapterMarks);
                }
            }
        });
        
    } catch (err) {
        console.error("Ошибка инициализации приложения:", err);
        if (DOM.titleName) DOM.titleName.textContent = "Ошибка загрузки";
    }
});

function initInteractivity() {
    let activeTab = "lore";
    
    // Навигация по тайтлам
    if (DOM.prevBtn) {
        DOM.prevBtn.addEventListener("click", () => {
            State.currentTitleIndex = (State.currentTitleIndex - 1 + State.mangaUniverse.length) % State.mangaUniverse.length;
            localStorage.setItem('last_title_index', String(State.currentTitleIndex));
            renderTitle(State.currentTitleIndex, State.mangaUniverse, State.chapterMarks);
            
            // ✅ НОВОЕ: Обновляем URL
            const currentTitle = State.mangaUniverse[State.currentTitleIndex];
            if (currentTitle) {
                updateURL(currentTitle.folder);
            }
        });
    }
    
    if (DOM.nextBtn) {
        DOM.nextBtn.addEventListener("click", () => {
            State.currentTitleIndex = (State.currentTitleIndex + 1) % State.mangaUniverse.length;
            localStorage.setItem('last_title_index', String(State.currentTitleIndex));
            renderTitle(State.currentTitleIndex, State.mangaUniverse, State.chapterMarks);
            
            // ✅ НОВОЕ: Обновляем URL
            const currentTitle = State.mangaUniverse[State.currentTitleIndex];
            if (currentTitle) {
                updateURL(currentTitle.folder);
            }
        });
    }
    
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
            DOM.pagesContainer.appendChild(fragment);
            DOM.pagesContainer.style.filter = (titleData.folder === "ChernoeBoloto")
                ? "blur(0.3px) drop-shadow(1.5px 0px 0px rgba(255,0,0,0.35)) drop-shadow(-1.5px 0px 0px rgba(0,0,255,0.35))"
                : "none";
            DOM.reader.classList.add("active");
            DOM.reader.scrollTo(0, 0);
            if (DOM.closeReaderBtn) {
                DOM.closeReaderBtn.style.display = "block";
            }
            const chIdx = parseInt(w.dataset.chIndex);
            State.activeChapterData = titleData.chapters[chIdx];
        });
    }
    
    if (DOM.closeReaderBtn) {
        DOM.closeReaderBtn.addEventListener("click", () => {
            DOM.reader.classList.remove("active");
            DOM.closeReaderBtn.style.display = "none";
            setTimeout(() => {
                DOM.pagesContainer.innerHTML = "";
                if (DOM.progressFill) {
                    DOM.progressFill.style.width = "0%";
                }
                State.activeChapterData = null;
            }, 400);
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
    
    if (DOM.archiveEyeBtn && DOM.archiveSidebar) {
        DOM.archiveEyeBtn.addEventListener("click", () => {
            DOM.archiveSidebar.classList.add("open");
            if (DOM.archiveIndicator) DOM.archiveIndicator.style.display = "none";
            if (activeTab === "chat") {
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true, State.chapterMarks);
            } else {
                const currentDb = (activeTab === "lore") ? State.archiveLoreDatabase : State.archiveArtifactsDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, activeTab === "artifacts", false, State.chapterMarks);
            }
        });
    }
    
    const tabButtons = document.querySelectorAll(".archive-tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTab = btn.dataset.tab;
            if (activeTab === "chat") {
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, [], false, true, State.chapterMarks);
            } else {
                const isArtifacts = (activeTab === "artifacts");
                const currentDb = isArtifacts ? State.archiveArtifactsDatabase : State.archiveLoreDatabase;
                updateArchiveDocuments(State.currentTitleIndex, State.mangaUniverse, currentDb, isArtifacts, false, State.chapterMarks);
            }
        });
    });
    
    if (DOM.closeArchiveBtn && DOM.archiveSidebar) {
        DOM.closeArchiveBtn.addEventListener("click", (e) => {
            e.stopPropagation();
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
         // ✅ НОВОЕ: Логика переключения Главы / Видео
    const viewSwitcher = document.querySelector('.view-switcher');
    const videosContainer = document.getElementById('videosContainer');
    
    if (viewSwitcher && videosContainer) {
        viewSwitcher.addEventListener('click', (e) => {
            const btn = e.target.closest('.switch-btn');
            if (!btn) return;
            
            // Переключаем активную кнопку
            viewSwitcher.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Переключаем вид
            State.activeView = btn.dataset.view;
            const currentTitle = State.mangaUniverse[State.currentTitleIndex];
            
            if (State.activeView === 'chapters') {
                DOM.chaptersContainer.classList.add('active');
                DOM.chaptersContainer.classList.remove('hidden');
                videosContainer.classList.remove('active');
                videosContainer.classList.add('hidden');
            } else {
                DOM.chaptersContainer.classList.remove('active');
                DOM.chaptersContainer.classList.add('hidden');
                videosContainer.classList.add('active');
                videosContainer.classList.remove('hidden');
                
                // Рендерим видео при переключении
                import('./ui.js').then(({ renderVideos }) => {
                    renderVideos(currentTitle.folder, currentTitle.videos || [], videosContainer);
                });
            }
        });
    }
    
    
    
}