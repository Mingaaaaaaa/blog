const fs = require('fs');
const path = require('path');

// Output HTML files (paginated)
function outputHtmlFiles(partitions, outputDir, title) {
    const fileCount = fs.readdirSync(outputDir).length;
    partitions.forEach((partition, index) => {
        let htmlContent = partition.join('');
        const pageNumber = fileCount + index + 1;
        const highlightScitpt = '<script>hljs.highlightAll()</script>';
        const pageNumberHtml = `<div class="page-number">${pageNumber}</div>`;

        let titleHtml = '';
        if (index > 0 && title) {
            titleHtml = `<div class="page-title-${pageNumber % 2 !== 0 ? 'even' : 'odd'}">${title}</div>`;
        }

        htmlContent = `${titleHtml}<div class="book-content">${htmlContent}</div>${pageNumberHtml}`;

        if (htmlContent.includes('<code>')) {
            htmlContent += highlightScitpt;
        }
        const outputFilePath = path.join(outputDir, `${pageNumber}.html`);
        fs.writeFileSync(outputFilePath, htmlContent, 'utf-8');
    });
    return fileCount + 1
}

exports.outputHtmlFiles = outputHtmlFiles;