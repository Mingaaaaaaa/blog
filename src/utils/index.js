const fs = require('fs');
const path = require('path');
const { readMarkdownFiles } = require('./readmd');
const { outputHtmlFiles } = require('./writehtml');
const { convertMarkdownToHtml } = require('./md2html');
const { partitionHtmlByHeightWithFixedWidth } = require('./splithtml');

const pageHeight = 350;
const pageWidth = 400;
const outputDir = path.join(__dirname, '..', 'pages');
const contentDir = path.join(__dirname, '..', '..', 'content');

(async () => {
  const mdFiles = readMarkdownFiles(contentDir);
  fs.rmSync(outputDir, { recursive: true, force: true });
  
  for (const mdFile of mdFiles) {
    const html = convertMarkdownToHtml(mdFile);
    const partitions = await partitionHtmlByHeightWithFixedWidth(html, pageHeight, pageWidth);
    outputHtmlFiles(partitions, outputDir);
    console.log(`${mdFile} converted and paginated HTML files generated successfully.`);
  }
})();