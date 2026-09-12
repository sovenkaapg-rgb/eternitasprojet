export const DOM = {
    titleName: document.getElementById("current-title-name"),
    titleSynopsis: document.getElementById("current-title-synopsis"),
    chaptersContainer: document.getElementById("chapters-list-container"),
    reader: document.getElementById("comic-reader"),
    pagesContainer: document.getElementById("reader-pages-container"),
    siteBackground: document.querySelector(".bg"),
    prevBtn: document.getElementById("prev-title-btn"),
    nextBtn: document.getElementById("next-title-btn"),
    gameAlert: document.getElementById("game-alert-toast") || document.getElementById("game-alert"),
    gameAlertText: document.getElementById("game-alert-text"),
    archiveEyeBtn: document.getElementById("archive-eye-btn"),
    archiveSidebar: document.getElementById("archive-sidebar"),
    closeArchiveBtn: document.getElementById("close-archive-btn"),
    documentsGrid: document.getElementById("documents-grid"),
    archiveIndicator: document.getElementById("archive-indicator"),
    descriptionZone: document.querySelector(".title-description-zone"),
    progressFill: document.getElementById("read-progress-fill"),
    closeReaderBtn: document.getElementById("close-reader-btn")
};

let gameAlertTimeout = null;

export function showGameAlert(text) {
    if (!DOM.gameAlert || !DOM.gameAlertText) return;
    DOM.gameAlertText.textContent = text;
    if (gameAlertTimeout) clearTimeout(gameAlertTimeout);
    DOM.gameAlert.classList.add("show");
    gameAlertTimeout = setTimeout(() => DOM.gameAlert.classList.remove("show"), 5000);
}
