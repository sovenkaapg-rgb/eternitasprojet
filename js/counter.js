/**
 * Модуль скрытого неонового счётчика посетителей (Левый нижний угол) + GoatCounter
 */

export function initSiteCounter() {
    // 1. АВТОМАТИЧЕСКИЙ ЗАПУСК GOATCOUNTER БЕЗ ЛОМАНИЯ HTML
    // Код сам создает скрытый скрипт в памяти браузера, поэтому в index.html ничего писать не нужно!
    try {
        const gcScript = document.createElement("script");
        // НАСТРОЙКА: Замените 'sovenkaapg' на то имя аккаунта (код), которое вы ввели при регистрации на goatcounter.com
        gcScript.setAttribute("data-goatcounter", "https://goatcounter.com");
        gcScript.async = true;
        gcScript.src = "//gc.zgo.at/count.js";
        document.head.appendChild(gcScript);
    } catch (e) {
        console.error("Ошибка инициализации метрики GoatCounter:", e);
    }

    // 2. СОЗДАНИЕ ВИЗУАЛЬНОГО ИНТЕРФЕЙСА (Ваш скрытый PNG-глаз)
    const counterWrapper = document.createElement("div");
    counterWrapper.className = "portal-stealth-counter";
    
    // Позиционируем строго в левом нижнем углу сайта
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

        <!-- Всплывающий блок при наведении -->
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
            <span style="
                color: #a09aa3;
                font-size: 11px;
                font-family: sans-serif;
            ">
                [ Счётчик запущен в Эфире ]
            </span>
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
