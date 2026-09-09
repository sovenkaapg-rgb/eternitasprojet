/**
 * Модуль интеграции безопасного форума Giscus через корневой HTML
 */

/**
 * Главный метод отрисовки комментариев Giscus
 * @param {HTMLElement} targetContainer - DOM-элемент сетки архива (DOM.documentsGrid)
 * @param {string} titleFolder - Имя папки комикса для разделения веток обсуждений
 */
export function renderComicComments(targetContainer, titleFolder) {
    if (!targetContainer) return;

    // 1. Просто создаем чистый контейнер с классом giscus, куда скрипт из index.html сам вставит чат
    targetContainer.innerHTML = `<div class="giscus" style="width: 100%; min-height: 300px; padding: 5px; box-sizing: border-box;"></div>`;

    // 2. Магия динамического переключения веток: общаемся с уже загруженным фреймом Giscus
    try {
        const iframe = document.querySelector('iframe.giscus-frame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
                { giscus: { setConfig: { term: titleFolder } } },
                'https://giscus.app'
            );
        }
    } catch (e) {
        console.log("Ожидание инициализации потока...");
    }
}
