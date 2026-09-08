/**
 * Модуль для работы со встроенным хранилищем браузера
 */
export const Storage = {
    isTitleUnlocked(folder) {
        return localStorage.getItem(`manga_unlocked_${folder}`) === "true";
    },

    setTitleUnlocked(folder, value = "true") {
        localStorage.setItem(`manga_unlocked_${folder}`, value);
    },

    isPageRead(pageProgressKey) {
        return localStorage.getItem(pageProgressKey) === "true";
    },

    setPageRead(pageProgressKey) {
        localStorage.setItem(pageProgressKey, "true");
    },

    clearAll() {
        localStorage.clear();
    }
};

