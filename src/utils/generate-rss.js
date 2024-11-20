const fs = require('fs');
const RSS = require('rss');
const path = require('path');

const siteUrl = 'alplune.top'
const rssFilePath = path.join(__dirname, '..', '..', 'rss.xml');

const feed = new RSS({
    title: "Alplune's Blog",
    description: "想成为全栈的前端菜鸟",
    feed_url: `alplune.top/rss.xml`,
    site_url: siteUrl,
    language: 'zh-cn',
    ttl: '60',
});

// 为每个 Markdown 文件生成 RSS 条目
function addRssItem(title, index, date) {
    feed.item({
        title: title,
        description: '',
        url: `${siteUrl}?page=${index}`,
        date: date,
    });
}
function writeRssFeed() {
    fs.writeFileSync(rssFilePath, feed.xml());
    console.log('RSS Feed 已生成！');
}

module.exports = { addRssItem, writeRssFeed };