
/* Модуль для работы с сетевыми запросами баз данных
 */
export async function fetchDatabases() {
    try {
        const [universeData, loreData, artifactsData] = await Promise.all([
            fetch('titles.json').then(res => res.json()),
            fetch('char.json').then(res => res.json()),
            fetch('artifacts.json').then(res => res.json()).catch(() => [])
        ]);
        return { universeData, loreData, artifactsData };
    } catch (err) {
        console.error("Ошибка при загрузке баз данных:", err);
        throw err;
    }
}

