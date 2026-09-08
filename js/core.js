import { Storage } from './storage.js';
import { DOM, showGameAlert, renderTitle, getLatestValue } from './ui.js';

export function handleReadingScroll(state) {
    if (!state.activeChapterData) return;

    const sTop = DOM.reader.scrollTop;
    const sHeight = DOM.reader.scrollHeight;
    const cHeight = DOM.reader.clientHeight;

    // Высчитываем точный процент прокрутки (от 0 до 100)
    const pct = sTop / (sHeight - cHeight);
    const displayPct = Math.min(Math.round(pct * 100), 100);

    // ОБНОВЛЕНИЕ СТАТУС-БАРА: Находим элемент полосы и меняем ширину
    const progressFill = document.getElementById("read-progress-fill");
    if (progressFill) {
        progressFill.style.width = `${displayPct}%`;
    }

    // Определяем текущую страницу для сверки с базой данных лора
    const curPage = Math.floor(pct * state.activeChapterData.pagesCount) + 1;
    const curFolder = state.mangaUniverse[state.currentTitleIndex].folder;
    const pageProgressKey = `${curFolder}_${state.activeChapterData.id}_p${curPage}`;

    if (!Storage.isPageRead(pageProgressKey)) {
        Storage.setPageRead(pageProgressKey);

        let dataUpdated = false;
        let alertMessage = "Архив обновлен!";
        let isTitleUnlockEvent = false;

        // 1. Проверяем разблокировку скрытых комиксов
        for (let i = 0, len = state.mangaUniverse.length; i < len; i++) {
            const title = state.mangaUniverse[i];
            if (title.isLocked && title.unlocksAt === pageProgressKey) {
                Storage.setTitleUnlocked(title.folder, "true");
                alertMessage = `Открыт доступ к разделу '${title.name}'!`;
                dataUpdated = true;
                isTitleUnlockEvent = true;
                break;
            }
        }

        // 2. Проверяем обновления лора персонажей
        for (let i = 0, len = state.archiveLoreDatabase.length; i < len; i++) {
            const char = state.archiveLoreDatabase[i];
            if (char.titleFolder === curFolder) {
                if (char.isSecret && char.unlockPage === pageProgressKey) {
                    dataUpdated = true;
                    if (!isTitleUnlockEvent) {
                        const charName = getLatestValue(char.nameStages, char.name);
                        alertMessage = `Новый персонаж: ${charName}!`;
                    }
                }
                const checkArray = [char.nameStages, char.typeStages, char.statusStages, char.biographyStages];
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
            renderTitle(state.currentTitleIndex, state.mangaUniverse);
        }
    }
    
        // ЗАКРЫТИЕ ЧИТАЛКИ (Триггер поднят к самой верхней анимированной линии экрана)
    if (!state.isClosing) {
        // Находим самую последнюю картинку-страницу комикса
        const lastPage = DOM.pagesContainer.lastElementChild;
        
        if (lastPage) {
            // Получаем ее текущие координаты на экране во время скролла
            const rect = lastPage.getBoundingClientRect();
            
            // rect.bottom — это нижний край последней страницы.
            // 60px — это уровень вашей верхней декоративной полосы .lines с небольшим зазором.
            // Как только нижний край картинки улетает вверх за эту линию, читалка закрывается.
            if (rect.bottom <= 60) {
                state.isClosing = true;
                DOM.reader.classList.remove("active");
                
                setTimeout(() => {
                    DOM.pagesContainer.innerHTML = "";
                    if (DOM.progressFill) {
                        DOM.progressFill.style.width = "0%"; // Сбрасываем парящую капсулу прогресса
                    }
                    state.isClosing = false;
                    state.activeChapterData = null;
                }, 400);
            }
        }
    }

   
}
