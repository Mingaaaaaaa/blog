const puppeteer = require('puppeteer');

// 初始化浏览器和页面
async function initializeBrowser() {
    const browser = await puppeteer.launch({ headless: false }); // headless: false 可以更好地观察页面
    const page = await browser.newPage();

    // 捕获页面内的 console.log 输出
    page.on('console', msg => {
        const message = msg.text();
        console.log('PAGE LOG:', message); // 输出到 Node.js 控制台
    });

    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                #book {
                    width: 480px;
                    height: 600px;
                    font-size: 16px;
                    padding: 52px 40px;
                }

                #book p {
                    margin: 20px 0;
                    text-indent: 32px;
                    line-height: 22px;
                }
                
                .no-indent {
                    text-indent: 0;
                }

                #book img {
                    max-width: 90%;
                    height: auto;
                }   

                .split-container p {
                    font-size: 16px;
                    text-indent: 2em;
                }
            </style>
        </head>
        <body id="book">
        </body>
        </html>
    `);

    return { browser, page };
}

async function getElementHeight(page, elementHtml, limitWidth) {
    // Wait for all images in the content to load
    await page.evaluate((html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);

        // Wait for each image to load
        const images = Array.from(tempDiv.querySelectorAll('img'));
        const promises = images.map(img => {
            return new Promise(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = resolve; // Resolve anyway to handle broken images gracefully
                }
            });
        });

        return Promise.all(promises).then(() => {
            document.body.removeChild(tempDiv);
        });
    }, elementHtml);

    // Now that images are loaded, get the height of the top-level element
    const elementHeight = await page.evaluate((html, limitWidth) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.width = `${limitWidth}px`;
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);

        const element = tempDiv.firstElementChild;
        const computedStyle = window.getComputedStyle(element);
        const marginBottom = parseFloat(computedStyle.marginBottom);
        const height = element.getBoundingClientRect().height;

        document.body.removeChild(tempDiv);
        console.log('Top-level element:', html, height, marginBottom);
        return height + marginBottom;
    }, elementHtml, limitWidth);

    // Retrieve HTML of each child element in an array
    const childHtmls = await page.evaluate((html) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        const element = tempDiv.firstElementChild;
        const childrenHtml = Array.from(element.children).map(child => child.outerHTML);
        document.body.removeChild(tempDiv);
        return childrenHtml;
    }, elementHtml);

    // Recursively get the heights of each child element in Node.js context
    const childrenHeights = [];
    for (const childHtml of childHtmls) {
        const childHeight = await getElementHeight(page, childHtml, limitWidth);
        console.log('Child element:', childHtml, 'Height:', childHeight);
        childrenHeights.push(childHeight);
    }

    // Sum the heights of all children
    const totalChildrenHeight = childrenHeights.reduce((sum, h) => sum + h, 0);

    // Return the greater of the top-level height or the accumulated child heights
    return Math.max(elementHeight, totalChildrenHeight);
}

// 获取HTML元素的高度和内容信息
async function getElementsInfo(page, htmlString, limitWidth) {
    // 创建临时容器解析HTML
    let elements = await page.evaluate((html, limitWidth) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.width = `${limitWidth}px`;
        tempDiv.innerHTML = html;

        return Array.from(tempDiv.children).map(child => ({
            tag: child.tagName.toLowerCase(),
            html: child.outerHTML,
            content: child.innerHTML
        }));
    }, htmlString, limitWidth);

    for (let element of elements) {
        element.height = await getElementHeight(page, element.html, limitWidth);
    }

    return elements;
}

// 处理分行
async function splitElementIntoTwoParts(page, content, containerWidth, leftHeight) {
    await page.setContent(`
        <div class="split-container" style="width: ${containerWidth}px;">${content}</div>
    `);

    return await page.evaluate((leftHeight) => {
        const container = document.querySelector('.split-container');
        let curContent = '';
        let nexContent = '';
        let cumulativeHeight = 0;

        // 测量高度的辅助函数
        const measureHeight = (html) => {
            const tempDiv = document.createElement('div');
            tempDiv.style.width = container.style.width;
            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv);
            const height = tempDiv.getBoundingClientRect().height;
            document.body.removeChild(tempDiv);
            return height;
        };

        // 处理节点的递归函数
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // 处理纯文本节点
                const chars = node.textContent.split('');
                let tempText = '';
                let lastMeasuredHeight = 0;

                for (const char of chars) {
                    tempText += char;
                    const testHtml = `<p style="text-indent:2em">${tempText}</p>`;
                    const nodeHeight = measureHeight(testHtml);

                    if (nodeHeight > lastMeasuredHeight) {
                        if (cumulativeHeight + (nodeHeight - lastMeasuredHeight) <= leftHeight) {
                            cumulativeHeight += (nodeHeight - lastMeasuredHeight);
                            lastMeasuredHeight = nodeHeight;
                        } else {
                            // 超出高度限制,回退一个字符
                            tempText = tempText.slice(0, -1);
                            // 将剩余文本添加到下一页,添加no-indent类
                            nexContent += `<p class="no-indent">${chars.slice(chars.indexOf(char)).join('')}</p>`;
                            break;
                        }
                    }
                }

                if (tempText) {
                    curContent += tempText;
                }

            } else if (node.nodeType === Node.ELEMENT_NODE) {
                console.log(node.tagName + "!!!")
                switch (node.tagName) {
                    case 'IMG':
                        // 处理图片
                        const originalHeight = node.getBoundingClientRect().height;
                        const originalWidth = node.getBoundingClientRect().width;
                        const remainingSpace = leftHeight - cumulativeHeight;

                        if (remainingSpace < originalHeight * 0.3) {
                            // 剩余空间不足,移至下一页
                            nexContent += node.outerHTML;
                        } else if (originalHeight > leftHeight) {
                            // 图片过高,等比缩放
                            const scaledImg = node.cloneNode(true);
                            if (originalWidth > container.clientWidth) {
                                scaledImg.style.width = '100%';
                            }
                            curContent += scaledImg.outerHTML;
                            cumulativeHeight += leftHeight;
                        } else if (remainingSpace < originalHeight) {
                            // 剩余空间不足,等比缩放
                            const scaledImg = node.cloneNode(true);
                            const scale = remainingSpace / originalHeight;
                            scaledImg.style.transform = `scale(${scale})`;
                            scaledImg.style.transformOrigin = 'top left';
                            if (originalWidth > container.clientWidth) {
                                scaledImg.style.width = '100%';
                            }
                            curContent += scaledImg.outerHTML;
                            cumulativeHeight += remainingSpace;
                        } else {
                            // 空间充足,直接放置
                            const scaledImg = node.cloneNode(true);
                            if (originalWidth > container.clientWidth) {
                                scaledImg.style.width = '100%';
                            }
                            curContent += scaledImg.outerHTML;
                            cumulativeHeight += originalHeight;
                        }
                        break;
                    case 'CODE':
                        // 处理pre标签里的子元素code
                        const codeElement = node;
                        if (codeElement) {
                            const codeContent = codeElement.textContent;
                            const codeLines = codeContent.split('\n');
                            let codeLineIndex = 0;
                            let codeLineHeight = 20; // 一行默认25px
                            let codeLineContent = '';

                            while (codeLineIndex < codeLines.length) {
                                codeLineContent += codeLines[codeLineIndex] + '\n';
                                const codeLineHtml = `<pre><code>${codeLineContent}</code></pre>`;

                                if (cumulativeHeight + codeLineHeight > leftHeight) {
                                    // 超出高度限制,回退到上一行
                                    codeLineContent = codeLineContent.slice(0, -1);
                                    // 将剩余代码添加到下一页,添加no-indent类
                                    nexContent += `<code>${codeLines.slice(codeLineIndex).join('\n')}</code>`;
                                    break;
                                } else {
                                    cumulativeHeight += codeLineHeight;
                                    codeLineIndex++;
                                }
                            }

                            if (codeLineContent) {
                                curContent += `<pre><code>${codeLineContent}</code></pre>`;
                            }
                        } else {
                            // 处理其他元素
                            const childHtml = node.outerHTML;
                            const nodeHeight = measureHeight(childHtml);

                            if (cumulativeHeight + nodeHeight <= leftHeight) {
                                curContent += childHtml;
                                cumulativeHeight += nodeHeight;
                            } else {
                                // 添加no-indent类到下一页内容
                                nexContent += childHtml.replace(/<p/g, '<p class="no-indent"');
                            }
                        }
                        break;
                    default:
                        // 处理其他元素
                        const childHtml = node.outerHTML;
                        const nodeHeight = measureHeight(childHtml);

                        if (cumulativeHeight + nodeHeight <= leftHeight) {
                            curContent += childHtml;
                            cumulativeHeight += nodeHeight;
                        } else {
                            // 添加no-indent类到下一页内容
                            nexContent += childHtml.replace(/<p/g, '<p class="no-indent"');
                        }
                }
            }
        };

        // 处理容器中的每个子节点
        container.childNodes.forEach(node => {
            if (cumulativeHeight <= leftHeight) {
                processNode(node);
            } else {
                // 超出高度限制的内容移至下一页,添加no-indent类
                nexContent += node.nodeType === Node.ELEMENT_NODE ?
                    node.outerHTML.replace(/<p/g, '<p class="no-indent"') :
                    `<p class="no-indent">${node.textContent}</p>`;
            }
        });

        return [curContent, nexContent];
    }, leftHeight);
}

// 获取单行的高度
async function getLineHeight(page, lineHtml, limitWidth) {
    return await page.evaluate((html, limitWidth) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.width = `${limitWidth}px`;
        tempDiv.style.whiteSpace = 'pre-wrap'; // 设置一个 style
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        const height = tempDiv.getBoundingClientRect().height;
        document.body.removeChild(tempDiv);
        return height;
    }, lineHtml, limitWidth);
}
// 主函数：按高度分割HTML
async function partitionHtmlByHeightWithFixedWidth(htmlString, targetHeight, containerWidth) {
    const { browser, page } = await initializeBrowser(containerWidth);
    const elements = await getElementsInfo(page, htmlString, containerWidth);
    const result = [];
    let currentHeight = 0;
    let currentPartition = [];

    let index = 0;
    while (index < elements.length) {
        let element = elements[index];
        console.log(element.tag, element.content, element.height, targetHeight - currentHeight);

        if (currentHeight + element.height > targetHeight) {
            switch (element.tag) {
                case 'p':
                    let remainingContent = element.content;
                    while (remainingContent) {
                        const lines = await splitElementIntoTwoParts(page, remainingContent, containerWidth, targetHeight - currentHeight);
                        console.log('split into two part', lines);
                        let [curContent, overflowContent] = lines;
                        currentPartition.push(`<p>${curContent}</p>`);
                        currentHeight += await getLineHeight(page, `<p>${curContent}</p>`, containerWidth);

                        if (overflowContent) {
                            result.push(currentPartition);
                            remainingContent = overflowContent;
                            currentPartition = [];
                            currentHeight = 0;
                        } else {
                            remainingContent = null;
                        }
                    }
                    break;
                case 'pre':
                    let codeRemainingContent = element.content;
                    while (codeRemainingContent) {
                        const codeLines = await splitElementIntoTwoParts(page, codeRemainingContent, containerWidth, targetHeight - currentHeight);
                        console.log('split into two part', codeLines);
                        let [curCodeContent, overflowCodeContent] = codeLines;
                        currentPartition.push(curCodeContent);
                        currentHeight += await getLineHeight(page, curCodeContent, containerWidth);
                        console.log('code height', curCodeContent,currentHeight,targetHeight, await getLineHeight(page, `<pre><code>${curCodeContent}</code></pre>`, containerWidth))
                        if (overflowCodeContent) {
                            result.push(currentPartition);
                            codeRemainingContent = overflowCodeContent;
                            currentPartition = [];
                            currentHeight = 0;
                        } else {
                            codeRemainingContent = null;
                        }
                    }
                    break;
                default:
                    result.push(currentPartition);
                    currentPartition = [element.html];
                    currentHeight = element.height;
                    break;
            }
        } else {
            currentHeight += element.height;
            currentPartition.push(element.html);
        }
        index++;
    }

    if (currentPartition.length > 0) {
        result.push(currentPartition);
    }

    await browser.close();
    return result;
}

exports.partitionHtmlByHeightWithFixedWidth = partitionHtmlByHeightWithFixedWidth;