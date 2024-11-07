const fs = require('fs');
const path = require('path');
const { readMarkdownFiles } = require('./readmd');
const { outputHtmlFiles } = require('./writehtml');
const { convertMarkdownToHtml } = require('./md2html');
const { partitionHtmlByHeightWithFixedWidth } = require('./splithtml');

const pageHeight = 376;
const pageWidth = 320;
const outputDir = path.join(__dirname, '..', 'pages');
const contentDir = path.join(__dirname, '..', '..', 'content');

(async () => {
  const mdFiles = readMarkdownFiles(contentDir);

  fs.rmSync(outputDir, { recursive: true, force: true });

  for (const mdFile of mdFiles) {
    const html = convertMarkdownToHtml(mdFile);

    let htmlWithMeta = html;
    const title = path.basename(mdFile, '.md');

    // 检查文件是否在 blogs 或 memos 目录下
    if (mdFile.includes('/blogs/') || mdFile.includes('/memos/')) {
      // 获取文件名作为标题

      // 获取文件创建时间
      const stats = fs.statSync(mdFile);
      const createTime = stats.birthtime.toLocaleDateString();

      // 添加标题和时间到HTML
      htmlWithMeta = `
        <h1 class="p-title">${title}</h1>
        <p class="create-time"> ${createTime}</p>
        ${html}
      `;
    }

    const partitions = await partitionHtmlByHeightWithFixedWidth(htmlWithMeta, pageHeight, pageWidth);

    outputHtmlFiles(partitions, outputDir, title);

    console.log(`${mdFile} converted and paginated HTML files generated successfully.`);
  }
})();