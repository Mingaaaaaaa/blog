const fs = require('fs');
const path = require('path');

const getFileInfo = (file, dir) => {
    
    const stats = fs.statSync(file);
    const title = path.basename(file, '.md');
    const lastModif = stats.mtime.toLocaleDateString();
    return { title, page: 0, lastModif }; // 假设page为0，实际情况可能需要根据文件内容或其他逻辑计算
};

const getFileList = (dir) => {
    const files = fs.readdirSync(dir).sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs).slice(0, 10);
    return files.map(file => getFileInfo(file, dir));
};

const generateConstantContent = (memoFiles, blogsFiles, numberOfPages) => {
    const constantContent = `var memoFiles = [${memoFiles.map(file => JSON.stringify(file)).join(', ')}];\nvar blogsFiles = [${blogsFiles.map(file => JSON.stringify(file)).join(', ')}];\nvar numberOfPages = ${numberOfPages};`;
    return constantContent;
};

module.exports = { getFileInfo, getFileList, generateConstantContent };
