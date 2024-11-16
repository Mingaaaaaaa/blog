const fs = require('fs');
const path = require('path');
const { readMarkdownFiles } = require('./readmd');
const { outputHtmlFiles } = require('./writehtml');
const { convertMarkdownToHtml } = require('./md2html');
const { addRssItem, writeRssFeed } = require('./generate-rss');
const { partitionHtmlByHeightWithFixedWidth } = require('./splithtml');
const { getFileInfo, generateConstantContent } = require('./getFileInfo')

const pageHeight = 451; //600-52*2-45
const pageWidth = 445.5;

const outputDir = path.join(__dirname, '..', 'pages');
const contentDir = path.join(__dirname, '..', '..', 'content');
const preservedFiles = ['1.html', '2.html', '3.html'];

(async () => {
  const mdFiles = readMarkdownFiles(contentDir);

  // 删除输出目录中的所有文件，但保留1,2,3.html
  fs.readdirSync(outputDir).forEach(file => {
    if (!preservedFiles.includes(file)) {
      fs.unlinkSync(path.join(outputDir, file));
    }
  });

  let memoFiles = [];
  let blogsFiles = [];

  for (const mdFile of mdFiles) {
    const html = convertMarkdownToHtml(mdFile);
    let htmlWithMeta = html;

    const title = path.basename(mdFile, '.md');

    // 文章标题和时间信息
    const stats = fs.statSync(mdFile);
    const createTime = stats.birthtime.toLocaleDateString();
    if (mdFile.includes('/blogs/') || mdFile.includes('/memos/')) {
      htmlWithMeta = `
        <h1 class="p-title">${title}</h1>
        <p class="create-time"> ${createTime}</p>
        ${html}
      `;
    }

    const partitions = await partitionHtmlByHeightWithFixedWidth(htmlWithMeta, pageHeight, pageWidth);

    const startPage = outputHtmlFiles(partitions, outputDir, title);

    addRssItem(title, startPage, createTime);

    const fileInfo = getFileInfo(mdFile, path.dirname(mdFile));
    fileInfo.page = startPage;
    if (mdFile.includes('/memos/')) {
      memoFiles.push(fileInfo);
    } else if (mdFile.includes('/blogs/')) {
      blogsFiles.push(fileInfo);
    }

    console.log(`${mdFile} converted and paginated HTML files generated successfully.`);
  }

  // 对文件列表进行排序
  memoFiles.sort((a, b) => new Date(b.lastModif) - new Date(a.lastModif));
  blogsFiles.sort((a, b) => new Date(b.lastModif) - new Date(a.lastModif));

  // 生成 constant.js 内容
  const constantContent = generateConstantContent(memoFiles, blogsFiles);
  fs.writeFileSync(path.join(__dirname, '..', 'constant.js'), constantContent, 'utf-8');

  //rss
  writeRssFeed()
})();