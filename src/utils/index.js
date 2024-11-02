const puppeteer = require('puppeteer');

async function getElementHeight(html) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const height = await page.evaluate(() => {
        const container = document.querySelector('.container');
        return container ? container.clientHeight : 0;
    });
    await browser.close();
    return height;
}

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      width: 300px;
      padding: 20px;
      background-color: lightgray;
    }
  </style>
</head>
<body>
  <div class="container">Hello, World!</div>
</body>
</html>
`;

getElementHeight(html).then(height => {
    console.log(`Element height: ${height}px`);
});