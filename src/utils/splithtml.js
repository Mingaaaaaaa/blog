const puppeteer = require('puppeteer');

// Use Puppeteer to split HTML by height with fixed width, handling line-by-line splitting for <p> elements
async function partitionHtmlByHeightWithFixedWidth(htmlString, targetHeight, containerWidth) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body, html { margin: 0; padding: 0; }
                .container { width: ${containerWidth}px; }
                .on-indent { padding-left: 2em; }
            </style>
        </head>
        <body>
            <div class="container">${htmlString}</div>
        </body>
        </html>
    `);

    const elements = await page.evaluate(() => {
        const container = document.querySelector('.container');
        const children = Array.from(container.children);
        // 获取元素的完整高度，包括margin
        function getFullHeight(element) {
            const computedStyle = window.getComputedStyle(element);
            const marginTop = parseFloat(computedStyle.marginTop);
            const marginBottom = parseFloat(computedStyle.marginBottom);
            const elementHeight = element.getBoundingClientRect().height;
            return elementHeight + marginTop + marginBottom;
        }

        return children.map(child => ({
            tag: child.tagName.toLowerCase(),
            html: child.outerHTML,
            height: getFullHeight(child),
            content: child.innerHTML,
        }));
    });

    const result = [];
    let currentHeight = 0;
    let currentPartition = [];

    for (const element of elements) {
        if (currentHeight + element.height > targetHeight) {
            if (element.tag === 'p') {
                // Split <p> content line-by-line if it overflows
                await page.setContent(`<div style="width: ${containerWidth}px;">${element.content}</div>`);
                const lines = await page.evaluate(() => {
                    const words = document.body.firstChild.innerText.split(' ');
                    let tempContent = '';
                    const lines = [];

                    words.forEach(word => {
                        const testLine = tempContent ? tempContent + ' ' + word : word;
                        document.body.firstChild.innerText = testLine;
                        const height = document.body.firstChild.getBoundingClientRect().height;

                        if (lines.length === 0 || height <= document.body.firstChild.scrollHeight) {
                            tempContent = testLine;
                        } else {
                            lines.push(tempContent);
                            tempContent = word;
                        }
                    });

                    if (tempContent) lines.push(tempContent); // Add last line
                    return lines;
                });

                let overflowContent = '';
                for (let i = 0; i < lines.length; i++) {
                    const lineHtml = `<p${i > 0 ? ' class="on-indent"' : ''}>${lines[i]}</p>`;
                    const lineHeight = await page.evaluate(lineHtml => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = lineHtml;
                        document.body.appendChild(tempDiv);
                        const height = tempDiv.getBoundingClientRect().height;
                        document.body.removeChild(tempDiv);
                        return height;
                    }, lineHtml);

                    if (currentHeight + lineHeight > targetHeight) {
                        overflowContent += lineHtml; // Store remaining lines for next page
                    } else {
                        currentPartition.push(lineHtml);
                        currentHeight += lineHeight;
                    }
                }

                if (overflowContent) {
                    result.push(currentPartition); // Push current page content
                    currentPartition = [overflowContent]; // Start new page with overflow content
                    currentHeight = 0;
                }
            } else {
                result.push(currentPartition); // Push current page content
                currentPartition = [element.html]; // Start new page with the current element
                currentHeight = element.height;
            }
        } else {
            currentHeight += element.height;
            currentPartition.push(element.html);
        }
    }

    if (currentPartition.length > 0) {
        result.push(currentPartition);
    }

    await browser.close();
    return result;
}

exports.partitionHtmlByHeightWithFixedWidth = partitionHtmlByHeightWithFixedWidth;