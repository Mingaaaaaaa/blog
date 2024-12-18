const fs = require('fs');
const path = require('path');

function readMarkdownFiles(contentDir) {
    const mdFiles = [];
    const orderedFiles = ['blogs', 'memos', 'friends.md'];

    for (const item of orderedFiles) {
        const itemPath = path.join(contentDir, item);
        if (fs.existsSync(itemPath)) {
            if (fs.statSync(itemPath).isFile() && item.endsWith('.md')) {
                mdFiles.push(itemPath);
            } else if (fs.statSync(itemPath).isDirectory()) {
                const folderFiles = fs.readdirSync(itemPath)
                    .filter(file => file.endsWith('.md'))
                    .map(file => path.join(itemPath, file));
                mdFiles.push(...folderFiles);
            }
        }
    }
    return mdFiles;
}

exports.readMarkdownFiles = readMarkdownFiles;