import { Storage } from './storage.js';
import { DOM, showGameAlert, renderTitle, getLatestValue } from './ui.js';

export function handleReadingScroll(state) {
    if (!state.activeChapterData) return;

    const sTop = DOM.reader.scrollTop;
    const sHeight = DOM.reader.scrollHeight;
    const cHeight = DOM.reader.clientHeight;
    const pct = sTop / (sHeight - cHeight);
    const displayPct = Math.min(Math.round(pct * 100), 100);

    // Обновление статус-бара
    const progressFill = document.getElementById("read-progress-fill");
    if (progressFill) {
        progressFill.style.width = `${displayPct}%`;
    }

    // Определяем текущую страницу
    const curPage = Math.floor(pct * state.activeChapterData.pages_count) + 1;
    const curFolder = state.mangaUniverse[state.currentTitleIndex].folder;
    const pageProgressKey = `${curFolder}_${state.activeChapterData.chapter_id_str}_p${curPage}`;

    if (!Storage.isPageRead(pageProgressKey)) {
        Storage.setPageRead(pageProgressKey);
        let dataUpdated = false;
        let alertMessage = "Архив обновлен!";
        let isTitleUnlockEvent = false;

        // 1. Проверяем разблокировку скрытых комиксов
        for (let i = 0, len = state.mangaUniverse.length; i < len; i++) {
            const title = state.mangaUniverse[i];
            if (title.is_locked && title.unlocks_at === pageProgressKey) {
                Storage.setTitleUnlocked(title.folder, "true");
                alertMessage = `Открыт доступ к разделу '${title.name}'!`;
                dataUpdated = true;
                isTitleUnlockEvent = true;
                title.is_locked = false;
                break;
            }
        }

        // 2. Проверяем обновления лора персонажей
        for (let i = 0, len = state.archiveLoreDatabase.length; i < len; i++) {
            const char = state.archiveLoreDatabase[i];
            if (char.title_folder === curFolder) {
                if (char.is_secret && char.unlock_page === pageProgressKey) {
                    dataUpdated = true;
                    if (!isTitleUnlockEvent) {
                        const charName = getLatestValue(char.name_stages, char.name);
                        alertMessage = `Новый персонаж: ${charName}!`;
                    }
                }
                const checkArray = [char.name_stages, char.type_stages, char.biography_stages];
                for (let j = 0; j < checkArray.length; j++) {
                    const arr = checkArray[j];
                    if (arr && Array.isArray(arr)) {
                        for (let k = 0; k < arr.length; k++) {
                            if (arr[k].page === pageProgressKey) {
                                dataUpdated = true;
                                if (!isTitleUnlockEvent) alertMessage = `Данные Архива обновлены!`;
                            }
                        }
                    }
                }
            }
        }

        if (dataUpdated) {
            if (DOM.archiveIndicator) DOM.archiveIndicator.style.display = "block";
            showGameAlert(alertMessage);
            renderTitle(state.currentTitleIndex, state.mangaUniverse, state.chapterMarks);
        }
    }

    // Закрытие читалки при достижении конца
       // Закрытие читалки при достижении конца
    if (!state.isClosing) {
        const lastPage = DOM.pagesContainer.lastElementChild;
        if (lastPage) {
            const rect = lastPage.getBoundingClientRect();
            if (rect.bottom <= 60) {
                state.isClosing = true;
                DOM.reader.classList.remove("active");
                setTimeout(() => {
                    DOM.pagesContainer.innerHTML = "";
                    // Используем глобальный объект DOM из ui.js
                    if (DOM.progressFill) {
                        DOM.progressFill.style.width = "0%";
                    }
                    state.isClosing = false;
                    state.activeChapterData = null;
                }, 400);
            }
        }
    }

}