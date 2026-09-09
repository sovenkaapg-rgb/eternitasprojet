/**
 * Модуль скрытого неонового счётчика посетителей (Левый нижний угол) на базе CounterAPI
 */

export async function initSiteCounter() {
    // Уникальные ключи для вашей базы данных.
    // Название 'eternitas_manga_project' создаст изолированную ячейку лично для вас
    const namespace = "sovenkaapgs-team-5459";
    const key = "first-counter-5459";

    // API-ссылка для автоматического накручивания +1 просмотра при каждом заходе
    const incrementUrl = `https://counterapi.dev{namespace}/${key}/increment`;

    let currentCount = "000000"; // Стартовое значение на случай сбоя сети

    // 1. Быстро запрашиваем у облака текущее число просмотров без блокировок браузера
    try {
        const response = await fetch(incrementUrl);
        const data = await response.json();
        if (data && data.value) {
            // Форматируем число, чтобы оно выглядело по-игровому (например, 000142)
            currentCount = String(data.value).padStart(6, '0');
        }
    } catch (err) {
        console.warn("Режим автономного подключения. Облако недоступно локально.");
    }

    // 2. Создаем главный контейнер для левого нижнего угла
    const counterWrapper = document.createElement("div");
    counterWrapper.className = "portal-stealth-counter";
    
    // Задаем базовые стили для закрепления в левом нижнем углу
    Object.assign(counterWrapper.style, {
        "position": "fixed",
        "bottom": "20px",
        "left": "20px",
        "z-index": "9999",
        "display": "flex",
        "align-items": "center",
        "gap": "12px",
        "font-family": "sans-serif"
    });

    counterWrapper.innerHTML = `
        <!-- Ваша иконка-глаз из ресурсов (imgR/eye.webp) -->
        <img src="imgR/eye.webp" class="stealth-eye-icon" alt="System Node" style="
            width: 24px;
            height: 24px;
            object-fit: contain;
            opacity: 0.35;
            cursor: pointer;
            filter: drop-shadow(0 0 5px rgba(255, 123, 0, 0));
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        " />
        
        <!-- Всплывающий блок счётчика -->
        <div class="stealth-counter-data" style="
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 3px;
            opacity: 0;
            visibility: hidden;
            transform: translateX(-10px);
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            pointer-events: none;
        ">
            <span style="
                color: #ff7b00; 
                font-size: 8px; 
                font-weight: bold; 
                letter-spacing: 1px;
                text-shadow: 0 0 5px rgba(255, 123, 0, 0.5);
                white-space: nowrap;
            ">
                SYSTEM ACTIVE // MONITORING
            </span>
            
            <!-- Полностью ваш собственный неоновый индикатор с цифрами вместо картинок -->
            <div style="
                background: #1b1424;
                border: 1px solid #ff7b00;
                border-radius: 4px;
                padding: 3px 8px;
                font-size: 11px;
                font-weight: bold;
                color: white;
                letter-spacing: 1px;
                box-shadow: 0 0 8px rgba(255, 123, 0, 0.4);
                display: flex;
                gap: 5px;
            ">
            
                <span style="color: #ff7b00; font-size: 9px; text-transform: uppercase;">Nodes:</span>
                <span>${currentCount}</span>
            </div>
        </div>
    `;

    // 3. Интерактивность наведения мыши (Hover)
    const eyeIcon = counterWrapper.querySelector(".stealth-eye-icon");
    const counterData = counterWrapper.querySelector(".stealth-counter-data");

    if (eyeIcon && counterData) {
        counterWrapper.addEventListener("mouseenter", () => {
            eyeIcon.style.opacity = "1";
            eyeIcon.style.filter = "drop-shadow(0 0 8px #ff7b00) brightness(1.2)";
            eyeIcon.style.transform = "scale(1.1) rotate(15deg)";
            
            counterData.style.opacity = "1";
            counterData.style.visibility = "visible";
            counterData.style.transform = "translateX(0)";
        });

        counterWrapper.addEventListener("mouseleave", () => {
            eyeIcon.style.opacity = "0.35";
            eyeIcon.style.filter = "drop-shadow(0 0 5px rgba(255, 123, 0, 0))";
            eyeIcon.style.transform = "scale(1) rotate(0deg)";
            
            counterData.style.opacity = "0";
            counterData.style.visibility = "hidden";
            counterData.style.transform = "translateX(-10px)";
        });
    }

    // Встраиваем готовый элемент на экран сайта
    document.body.appendChild(counterWrapper);
}
