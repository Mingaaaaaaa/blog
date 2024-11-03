const fs = require('fs');
const showdown = require('showdown');

// Convert Markdown file to HTML
exports.convertMarkdownToHtml = function convertMarkdownToHtml(filePath) {
    const converter = new showdown.Converter();
    const markdown = fs.readFileSync(filePath, 'utf-8');
    return converter.makeHtml(markdown);
}