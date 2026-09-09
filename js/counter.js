/**
 * Модуль скрытого неонового счётчика посетителей (Левый нижний угол)
 */

export function initSiteCounter() {
    // 1. Создаем главный контейнер для левого нижнего угла
    const counterWrapper = document.createElement("div");
    counterWrapper.className = "portal-stealth-counter";
    
    // Задаем базовые стили для закрепления в левом нижнем углу
    // ИСПРАВЛЕНО: Все CSS-свойства с дефисами теперь обернуты в кавычки для JS-совместимости
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

    // ИСПРАВЛЕНО: Возвращаем правильный системный SVG-адрес генератора счетчиков для GitHub
    const counterSvgUrl = `https://seeyoufarm.com`;

    // 2. Наполняем разметку: ваш PNG-глаз и скрытый блок с цифрами
    counterWrapper.innerHTML = `
        <!-- Ваша иконка-глаз из ресурсов -->
        <img src="ПАПКА С РЕСУРСАМИ/eye.png" class="stealth-eye-icon" alt="System Node" style="
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
                SYSTEM ACTIVE // CONNECTED
            </span>
            <div style="filter: drop-shadow(0 0 6px rgba(255, 123, 0, 0.5));">
                <img src="${counterSvgUrl}" alt="Nodes" style="display: block; height: 16px; border-radius: 3px;" />
            </div>
        </div>
    `;

    // 3. Добавляем интерактивность наведения мыши (Hover) через JS
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

    // Встраиваем готовый элемент на все экраны сайта
    document.body.appendChild(counterWrapper);
}
