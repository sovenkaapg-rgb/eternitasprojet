export async function fetchDatabases() {
    const SUPABASE_URL = "https://tbjxlennbadvkevuyanf.supabase.co";
    const ANON_KEY = "sb_publishable_GmAdwVfKmLnY9KRYv4WWSA_OE7dgZJH";
    const headers = {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
    };
    
try {
    const [titlesRes, charsRes, artifactsRes] = await Promise.all([
        // ✅ ТОЛЬКО ОДИН запрос к titles с videos
        fetch(`${SUPABASE_URL}/rest/v1/titles?select=*,chapters(*),videos(title, url, sort_order)`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/characters?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/artifacts?select=*`, { headers })
    ]);
        
        if (!titlesRes.ok || !charsRes.ok || !artifactsRes.ok) {
            throw new Error(`HTTP ошибка: titles=${titlesRes.status}, chars=${charsRes.status}, artifacts=${artifactsRes.status}`);
        }
        
        const universeData = await titlesRes.json();
        const loreData = await charsRes.json();
        const artifactsData = await artifactsRes.json();
        
        // Сортируем главы
        universeData.forEach(title => {
            if (title.chapters && Array.isArray(title.chapters)) {
                title.chapters.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            }
            // Сортируем видео
            if (title.videos && Array.isArray(title.videos)) {
                title.videos.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            }
        });
        
        // Сортируем тайтлы
        universeData.sort((a, b) => {
            if (a.folder === 'ChernoeBoloto') return -1;
            if (b.folder === 'ChernoeBoloto') return 1;
            return a.folder.localeCompare(b.folder);
        });
        
        console.log("✅ База данных Supabase загружена:", {
            titles: universeData.length,
            characters: loreData.length,
            artifacts: artifactsData.length
        });
        
        return { universeData, loreData, artifactsData };
    } catch (err) {
        console.error("❌ Ошибка загрузки базы данных:", err);
        return { universeData: [], loreData: [], artifactsData: [] };
    }
}

// Функция загрузки печатей глав
export async function loadChapterMarks() {
    const SUPABASE_URL = "https://tbjxlennbadvkevuyanf.supabase.co";
    const ANON_KEY = "sb_publishable_GmAdwVfKmLnY9KRYv4WWSA_OE7dgZJH";

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/chapter_marks?select=*`, {
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
            }
        });

        if (response.ok) {
            const marks = await response.json();
            console.log("✅ Печати глав загружены:", marks.length);
            return marks;
        }
    } catch (err) {
        console.warn("⚠️ Не удалось загрузить печати:", err);
    }

    return [];
}

// Функция для получения публичной ссылки на изображения из хранилища Supabase
export function getStorageUrl(filePath) {
    const SUPABASE_URL = "https://tbjxlennbadvkevuyanf.supabase.co";
    const BUCKET_NAME = "comic-assets";
    
    // Очищаем путь от лишних ведущих слэшей, если они есть
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}
