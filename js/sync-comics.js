

// НАСТРОЙКИ SUPABASE
//const SUPABASE_URL = "https://tbjxlennbadvkevuyanf.supabase.co";
//const SUPABASE_SERVICE_KEY = "sb_publishable_GmAdwVfKmLnY9KRYv4WWSA_OE7dgZJH"; 
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// НАСТРОЙКИ SUPABASE
const SUPABASE_URL = "https://tbjxlennbadvkevuyanf.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_publishable_GmAdwVfKmLnY9KRYv4WWSA_OE7dgZJH";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ТОЧНЫЙ ПУТЬ К ВАШЕЙ ПАПКЕ С ТАЙТЛАМИ (на скриншоте это папка Titles)
const COMICS_DIR = path.resolve('./Titles'); 

// Расширения файлов, которые мы считаем страницами комикса
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

async function syncComics() {
    console.log("🚀 Запуск сканирования директорий...");

    if (!fs.existsSync(COMICS_DIR)) {
        console.error(`❌ Корневая папка ${COMICS_DIR} не найдена! Проверьте путь.`);
        return;
    }

    // 1. Автоматически читаем ВСЕ папки тайтлов (ChernoeBoloto, Chronos, DieR, DieS, Slepye и т.д.)
    const folders = fs.readdirSync(COMICS_DIR).filter(file => {
        return fs.statSync(path.join(COMICS_DIR, file)).isDirectory();
    });

    for (const folder of folders) {
        const titlePath = path.join(COMICS_DIR, folder);
        
        // Проверяем, существует ли уже этот тайтл в базе данных Supabase
        let { data: titleRecord, error: findError } = await supabase
            .from('titles')
            .select('id, name')
            .eq('folder', folder)
            .single();

        // Если тайтла нет в базе — создаем дефолтную запись, используя имя папки как название
        if (!titleRecord) {
            console.log(`🆕 Найдена новая папка тайтла: "${folder}". Регистрируем в БД...`);
            
            // Первую папку (например, ChernoeBoloto) делаем открытой, остальные автоматически блокируем
            // Если вам не нужна автоматическая блокировка, просто поставьте false для всех
            const isFirstTitle = folder === "ChernoeBoloto"; 

            const { data: newTitle, error: insertError } = await supabase
                .from('titles')
                .insert([{ 
                    folder: folder, 
                    name: folder, // Временное имя (совпадает с папкой). Настоящее имя впишете в панели Supabase
                    synopsis: "Описание ожидает добавления через панель Supabase...",
                    is_locked: !isFirstTitle
                }])
                .select()
                .single();

            if (insertError) {
                console.error(`❌ Ошибка создания тайтла ${folder}:`, insertError.message);
                continue;
            }
            titleRecord = newTitle;
        }

        console.log(`🔎 [${titleRecord.name}] — сканируем папки глав внутри...`);

        // 2. Находим ВСЕ подпапки глав (ch1, ch2, ch3...), игнорируя файлы вроде cover.webp
        const chapterFolders = fs.readdirSync(titlePath).filter(file => {
            return fs.statSync(path.join(titlePath, file)).isDirectory() && file.startsWith('ch');
        });

        // Если у тайтла вообще нет папок с главами (как у вас в файле для Chronos и DieS)
        if (chapterFolders.length === 0) {
            console.log(`       ℹ️ Внутри папки "${folder}" глав пока нет. Пропускаем.`);
            continue;
        }

        for (const chFolder of chapterFolders) {
            const chPath = path.join(titlePath, chFolder);

            // 3. Считаем файлы картинок внутри текущей главы
            // 3. Считаем файлы картинок внутри текущей главы, исключая обложки
        const pages = fs.readdirSync(chPath).filter(file => {
        const ext = path.extname(file).toLowerCase();
        const filename = file.toLowerCase();
        // Проверяем, что это картинка
        const isImage = IMAGE_EXTENSIONS.includes(ext);
        // СТРОГОЕ ИСКЛЮЧЕНИЕ: файл НЕ должен содержать слово "cover" в названии
        const isNotCover = !filename.includes('cover');
        // Игнорируем скрытые системные файлы (например, .DS_Store или Thumbs.db)
        const isNotSystem = !filename.startsWith('.') && filename !== 'thumbs.db';
       return isImage && isNotCover && isNotSystem;
});

const pagesCount = pages.length;
            
            // Формируем красивое имя для отображения на сайте
            const chNum = chFolder.replace('ch', '');
            let displayNum = `${chNum} ГЛАВА`;
            
            // Сохраняем ваше кастомное название для первой главы Черного Болота
            if (folder === "ChernoeBoloto" && chFolder === "ch1") {
                displayNum = "начало";
            }
            
            // Извлекаем номер главы из имени папки (ch1 → 1, ch10 → 10, ch2 → 2)
            const chapterNumber = parseInt(chFolder.replace('ch', ''), 10);
            
            // 4. Отправляем данные в Supabase (создаем главу или обновляем счетчик страниц, если она уже была)
            const { error: upsertError } = await supabase
                .from('chapters')
                .upsert({
                    title_id: titleRecord.id,
                    chapter_id_str: chFolder,
                    display_num: displayNum,
                    pages_count: pagesCount,
                    sort_order: chapterNumber
                }, {
                    onConflict: 'title_id,chapter_id_str' // Условие уникальности главы внутри одного комикса
                });

            if (upsertError) {
                console.error(`  ❌ Ошибка синхронизации главы ${chFolder} для ${folder}:`, upsertError.message);
            } else {
                console.log(`  ✅ Глава ${chFolder}: успешно посчитано страниц -> ${pagesCount}`);
            }
        }
    }
    console.log("🏁 Все папки проверены. База данных Supabase находится в актуальном состоянии!");
}

syncComics();