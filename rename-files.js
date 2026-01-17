const fs = require('fs');
const path = require('path');

const MEDIA_DIR = path.join(__dirname, 'rideengine-media');

function renameFiles() {
    if (!fs.existsSync(MEDIA_DIR)) {
        console.error('Media directory not found:', MEDIA_DIR);
        return;
    }

    const folders = fs.readdirSync(MEDIA_DIR).filter(file => {
        return fs.statSync(path.join(MEDIA_DIR, file)).isDirectory();
    });

    console.log(`Found ${folders.length} folders to process.\n`);

    folders.forEach(folder => {
        const folderPath = path.join(MEDIA_DIR, folder);
        const files = fs.readdirSync(folderPath);
        let count = 0;

        files.forEach(file => {
            // Skip if already renamed (check if starts with folder name)
            if (file.startsWith(folder + '-')) {
                return;
            }

            // Skip hidden files
            if (file.startsWith('.')) return;

            const oldPath = path.join(folderPath, file);
            const newFilename = `${folder}-${file}`;
            const newPath = path.join(folderPath, newFilename);

            try {
                fs.renameSync(oldPath, newPath);
                console.log(`[${folder}] Renamed: ${file} -> ${newFilename}`);
                count++;
            } catch (err) {
                console.error(`Error renaming ${file}:`, err.message);
            }
        });

        if (count > 0) {
            console.log(`Processed ${count} files in ${folder}\n`);
        }
    });

    console.log('Renaming complete!');
}

renameFiles();
