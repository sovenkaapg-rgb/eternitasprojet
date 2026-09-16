/**
 * Модуль предупреждения 17+
 * Показывает модальное окно при первом посещении
 * Зрачок глаза следит за курсором
 */

(function() {
    'use strict';
    
    const WARNING_KEY = 'warning_accepted_v1'; // Меняй версию при обновлении текста
    
    // Элементы
    let modal, acceptBtn, pupil, eyeContainer;
    
    // Параметры глаза для анимации зрачка
    const EYE_CONFIG = {
        maxMoveX: 12,  // Максимальное смещение зрачка по X (пиксели)
        maxMoveY: 8,   // Максимальное смещение зрачка по Y (пиксели)
        centerX: 100,  // Центр глаза в SVG координатах
        centerY: 60    // Центр глаза в SVG координатах
    };
    
    /**
     * Инициализация модуля
     */
    function init() {
        modal = document.getElementById('warningModal');
        acceptBtn = document.getElementById('warningAcceptBtn');
        pupil = document.querySelector('.warning-eye__pupil');
        eyeContainer = document.querySelector('.warning-eye');
        
        if (!modal || !acceptBtn) {
            console.warn('Warning modal elements not found');
            return;
        }
        
        // Проверяем, принимал ли пользователь предупреждение
        if (!localStorage.getItem(WARNING_KEY)) {
            showModal();
        }
    }
    
    /**
     * Показать модальное окно
     */
    function showModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку
        
        // Обработчик кнопки принятия
        acceptBtn.addEventListener('click', acceptWarning, { once: true });
        
        // Запускаем слежение за курсором
        startEyeTracking();
    }
    
    /**
     * Принять предупреждение
     */
    function acceptWarning() {
        localStorage.setItem(WARNING_KEY, 'true');
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Возвращаем прокрутку
        }, 300);
    }
    
    /**
     * Слежение за курсором для анимации зрачка
     */
    function startEyeTracking() {
        if (!pupil || !eyeContainer) return;
        
        document.addEventListener('mousemove', handleMouseMove);
    }
    
    /**
     * Обработка движения мыши
     */
    function handleMouseMove(e) {
        if (!pupil || !eyeContainer) return;
        
        // Получаем координаты центра глаза
        const eyeRect = eyeContainer.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;
        
        // Вычисляем расстояние от курсора до центра глаза
        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;
        
        // Вычисляем угол
        const angle = Math.atan2(deltaY, deltaX);
        
        // Вычисляем расстояние (нормализованное)
        const distance = Math.min(
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 100,
            1
        );
        
        // Смещение зрачка (ограниченное)
        const moveX = Math.cos(angle) * distance * EYE_CONFIG.maxMoveX;
        const moveY = Math.sin(angle) * distance * EYE_CONFIG.maxMoveY;
        
        // Применяем трансформацию к зрачку
        // Используем SVG transform через атрибут
        const pupilCX = EYE_CONFIG.centerX + moveX;
        const pupilCY = EYE_CONFIG.centerY + moveY;
        
        pupil.setAttribute('cx', pupilCX);
        pupil.setAttribute('cy', pupilCY);
        
        // Двигаем блик вместе с зрачком (немного смещен)
        const highlight = document.querySelector('.warning-eye__highlight');
        if (highlight) {
            highlight.setAttribute('cx', pupilCX - 7);
            highlight.setAttribute('cy', pupilCY - 7);
        }
    }
    
    // Запускаем при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();