/**
 * Изолированный модуль форума/комментариев через бесплатную базу Supabase
 */

// ==========================================
// НАСТРОЙКА: Вставьте сюда свои ключи из настроек Supabase (Вкладка API)
// ==========================================
const SUPABASE_URL = "https://lxfkjjctsrakayzqyiac.supabase.co";
const SUPABASE_KEY = "sb_publishable_zMxBVM29AeqCja0GdMGJ5g_CKPJmGgf"

/**
 * Главный метод отрисовки форума в Секретном Архиве
 * @param {HTMLElement} targetContainer - DOM-элемент сетки архива (DOM.documentsGrid)
 * @param {string} titleFolder - Имя папки комикса для разделения обсуждений
 */
export async function renderComicComments(targetContainer, titleFolder) {
    if (!targetContainer) return;

    // 1. Рисуем интерфейс нашего собственного чата (Форма ввода + блок для списка сообщений)
    targetContainer.innerHTML = `
        <div class="custom-forum" style="font-family: sans-serif; color: white; padding: 5px; box-sizing: border-box;">
            <span style="color: #ff7b00; font-size: 11px; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 12px;">
                СИНХРОНИЗАЦИЯ ЧАСТОТЫ // ${titleFolder.toUpperCase()}
            </span>

            <!-- Форма отправки сообщения -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                <input type="text" id="forum-nick" placeholder="Ваш Идентификатор (Никнейм)" style="
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,123,0,0.2); 
                    border-radius: 4px; padding: 8px; color: white; font-size: 12px; outline: none;
                " />
                <textarea id="forum-msg" placeholder="Введите сообщение в Эфир..." rows="3" style="
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,123,0,0.2); 
                    border-radius: 4px; padding: 8px; color: white; font-size: 12px; outline: none; resize: none;
                "></textarea>
                <button id="forum-send-btn" style="
                    background: #ff7b00; border: none; border-radius: 4px; padding: 8px; 
                    color: white; font-weight: bold; font-size: 12px; cursor: pointer; transition: background 0.2s;
                ">ОТПРАВИТЬ СИГНАЛ</button>
            </div>

            <!-- Лента сообщений -->
            <div id="forum-messages-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 45vh; overflow-y: auto;">
                Загрузка сообщений...
            </div>
        </div>
    `;

    const listContainer = document.getElementById("forum-messages-list");
    const sendBtn = document.getElementById("forum-send-btn");
    const nickInput = document.getElementById("forum-nick");
    const msgInput = document.getElementById("forum-msg");

    // Подгружаем существующие комментарии из базы данных
    async function loadComments() {
        try {
            // Отправляем обычный текстовый запрос к Supabase, отфильтрованный по ID текущего комикса
            const response = await fetch(`${SUPABASE_URL}/rest/v1/comic_comments?comic_id=eq.${titleFolder}&order=created_at.desc`, {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            });
            const comments = await response.json();

            if (!comments || comments.length === 0) {
                listContainer.innerHTML = `<div style="text-align:center; color:#666; font-size:12px; padding: 20px;">Эфир пуст. Будьте первыми!</div>`;
                return;
            }

            // Рендерим карточки комментариев в стиле вашей игры
            listContainer.innerHTML = comments.map(c => `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #ff7b00; font-size: 12px; font-weight: bold;">${c.nickname}</span>
                        <span style="color: #555; font-size: 10px;">${new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #b0aab2; line-height: 1.4;">${c.message}</p>
                </div>
            `).join("");

        } catch (err) {
            listContainer.innerHTML = `<div style="color:#ff3b30; font-size:12px;">Ошибка подключения к базе.</div>`;
        }
    }

    // Обработчик клика на кнопку «Отправить»
    sendBtn.addEventListener("click", async () => {
        const nickname = nickInput.value.trim();
        const message = msgInput.value.trim();

        if (!nickname || !message) {
            alert("Заполните позывной и текст сообщения!");
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = "ПЕРЕДАЧА...";

        try {
            // Отправляем POST запрос с новым комментарием в базу данных Supabase
            await fetch(`${SUPABASE_URL}/rest/v1/comic_comments`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    comic_id: titleFolder,
                    nickname: nickname,
                    message: message
                })
            });

            // Очищаем форму и обновляем список сообщений
            msgInput.value = "";
            await loadComments();

        } catch (e) {
            alert("Сбой передачи сигнала.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = "ОТПРАВИТЬ СИГНАЛ";
        }
    });

    // Запускаем первичную загрузку сообщений при открытии вкладки
    loadComments();
}
