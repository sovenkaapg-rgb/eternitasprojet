/**
 * Модуль интеграции бесплатного форума Giscus на базе GitHub Discussions
 */

/**
 * Главный метод отрисовки комментариев Giscus
 * @param {HTMLElement} targetContainer - DOM-элемент сетки архива (DOM.documentsGrid)
 * @param {string} titleFolder - Имя папки комикса для разделения веток обсуждений
 */
export function renderComicComments(targetContainer, titleFolder) {
    if (!targetContainer) return;

    // 1. Очищаем контейнер и создаем внутри него изолированный блок для Giscus
    targetContainer.innerHTML = `<div class="giscus" style="width: 100%; min-height: 300px; padding: 5px; box-sizing: border-box;"></div>`;

    // 2. Если скрипт Giscus уже был загружен ранее, удаляем его старую копию, чтобы избежать конфликтов
    const oldScript = document.getElementById('giscus-script');
    if (oldScript) oldScript.remove();

    // 3. Создаем новый элемент скрипта с вашими настройками репозитория
    const script = document.createElement('script');
    script.id = 'giscus-script';
    script.src = 'https://giscus.app/client.js';
    script.type = 'text/javascript';
    script.crossOrigin = 'anonymous';
    script.async = true;

    // ==========================================
    // ВАЖНО: НАСТРОЙКА ПОД ВАШ РЕПОЗИТОРИЙ
    // Замените значения ниже на данные вашего профиля и репозитория!
    // ==========================================
    script.setAttribute('data-repo', 'sovenkaapg-rgb/eternitasprojet'); 
    script.setAttribute('data-repo-id', 'R_kgDOUQjZYg'); 
    script.setAttribute('data-category', 'Announcements'); 
    script.setAttribute('data-category-id', 'DIC_kwDOUQjZYs4DFLby'); 
    
    // Привязываем ветку комментариев к имени папки комикса (например, ChernoeBoloto)
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', titleFolder); 
    
    // Игровые и языковые настройки под ваш стиль
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1'); // Включает смайлики-реакции к постам
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');  // Форма ввода нового полей будет сверху
    script.setAttribute('data-theme', 'dark');          // Включаем стильную темную тему
    script.setAttribute('data-lang', 'ru');              // Интерфейс полностью на русском языке

    // 4. Встраиваем скрипт в документ, и он сам развернет форум внутри класса .giscus
    document.body.appendChild(script);
}

