const fs = require('fs');
const path = require('path');

// Output HTML files (paginated)
function outputHtmlFiles(partitions, outputDir, title) {
    const fileCount = fs.readdirSync(outputDir).length;
    partitions.forEach((partition, index) => {
        const pageNumber = fileCount + index + 1;
        const htmlContent = partition.join('');
        const pageNumberHtml = `<div class="page-number">${pageNumber}</div>`;

        let titleHtml = '';
        if (index > 0 && title) {
            titleHtml = `<div class="page-title-${pageNumber % 2 !== 0 ? 'even' : 'odd'}">${title}</div>`;
        }

        const finalHtml = `${titleHtml}<div class="book-content">${htmlContent}</div>${pageNumberHtml}`;

        const outputFilePath = path.join(outputDir, `${pageNumber}.html`);
        fs.writeFileSync(outputFilePath, finalHtml, 'utf-8');
    });
    return fileCount + 1
}

exports.outputHtmlFiles = outputHtmlFiles;