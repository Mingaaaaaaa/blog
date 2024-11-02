const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const puppeteer = require('puppeteer');

// 读取 Markdown 文件并转换为 HTML
function convertMarkdownToHtml(filePath) {
    const converter = new showdown.Converter();
    const markdown = fs.readFileSync(filePath, 'utf-8');
    return converter.makeHtml(markdown);
}

// 使用 Puppeteer 按高度拆分 HTML
async function partitionHtmlByHeightWithFixedWidth(htmlString, targetHeight, containerWidth) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 设置页面内容为目标 HTML
    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body, html { margin: 0; padding: 0; }
                .container { width: ${containerWidth}px; }
            </style>
        </head>
        <body>
            <div class="container">${htmlString}</div>
        </body>
        </html>
    `);

    // 获取元素的高度
    const elements = await page.evaluate(() => {
        const container = document.querySelector('.container');
        const children = Array.from(container.children);
        return children.map(child => ({
            html: child.outerHTML,
            height: child.getBoundingClientRect().height
        }));
    });

    const result = [];
    let currentHeight = 0;
    let currentPartition = [];

    // 按高度分割元素
    for (const element of elements) {
        if (currentHeight + element.height > targetHeight) {
            result.push(currentPartition); // 存储当前分区
            currentPartition = [element.html];
            currentHeight = element.height;
        } else {
            currentHeight += element.height;
            currentPartition.push(element.html);
        }
    }

    // 如果有剩余元素，作为一个单独的分区添加
    if (currentPartition.length > 0) {
        result.push(currentPartition);
    }

    await browser.close();
    return result;
}

// 检查目录下已有的最大页数
function getStartingPageNumber(directory) {
    const files = fs.readdirSync(directory);
    const pageNumbers = files
        .map(file => parseInt(path.basename(file, '.html')))
        .filter(num => !isNaN(num));
    return pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;
}

// 输出 HTML 文件（按页输出）
function outputHtmlFiles(partitions, outputDir) {
    const startingPageNumber = getStartingPageNumber(outputDir);

    partitions.forEach((partition, index) => {
        const pageNumber = startingPageNumber + index;
        const htmlContent = partition.join('');
        const finalHtml = ` <div class="book-content">${htmlContent}</div>`;
        const outputFilePath = path.join(outputDir, `${pageNumber}.html`);
        fs.writeFileSync(outputFilePath, finalHtml, 'utf-8');
    });
}

// 主函数
(async () => {
    const contentDir = path.join(__dirname, '..', '..', 'content'); // Markdown 文件目录
    const outputDir = path.join(__dirname, '..', 'pages'); // 输出目录

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 获取所有 md 文件
    const mdFiles = fs.readdirSync(contentDir)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(contentDir, file));

    // 处理每个 md 文件
    for (const mdFile of mdFiles) {
        const html = convertMarkdownToHtml(mdFile);
        const partitions = await partitionHtmlByHeightWithFixedWidth(html, 350, 400); // 拆分 HTML
        outputHtmlFiles(partitions, outputDir); // 按页输出结果到多个 HTML 文件
    }

    console.log('All Markdown files converted and paginated HTML files generated successfully.');
})();