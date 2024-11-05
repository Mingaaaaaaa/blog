const fs = require('fs');
const path = require('path');

// Output HTML files (paginated)
function outputHtmlFiles(partitions, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const fileCount = fs.readdirSync(outputDir).length;
    partitions.forEach((partition, index) => {
        const pageNumber = fileCount + index + 1;
        const htmlContent = partition.join('');
        const finalHtml = `<div class="book-content">${htmlContent}</div>`;
        const outputFilePath = path.join(outputDir, `${pageNumber}.html`);
        fs.writeFileSync(outputFilePath, finalHtml, 'utf-8');
    });
}

exports.outputHtmlFiles = outputHtmlFiles;