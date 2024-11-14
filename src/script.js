// 获取pages目录下的文件总数
var numberOfPages = 0;
var slider = $('#slider');
var cur = $('#cur');
var isDragging = false;
var startX, sliderLeft;
var sliderWidth;
var targetPage = 0;

function init() {
    $.ajax({
        url: 'pages/',
        async: false,
        success: function (data) {
            // 计算HTML文件数量
            var regex = /href="[^"]*\.html"/g;
            var matches = data.match(regex);
            numberOfPages = matches ? matches.length : 0;

            // 初始化滑块宽度
            sliderWidth = slider.width() - cur.width();
            // 初始化slider的左边距
            sliderLeft = slider.offset().left;
        }
    });

    // Adds the pages that the book will need
    function addPage(page, book) {
        // 	First check if the page is already in the book
        if (!book.turn('hasPage', page)) {
            // Create an element for this page
            var element = $('<div />', { 'class': 'page ' + ((page % 2 == 0) ? 'odd' : 'even'), 'id': 'page-' + page }).html('<i class="loader"></i>');
            // If not then add the page
            book.turn('addPage', element, page);
            // 修改加载逻辑，根据页码加载对应的文件
            $.get(`pages/${page}.html`, function (data) {
                element.html(data);
            }).fail(function () {
                // 如果特定页面文件不存在，回退到默认的output.html
                element.html('<div class="data">Data for page ' + page + '</div>');
            });
        }
    }

    function getViewNumber(book, page) {
        return parseInt((page || book.turn('page')) / 2 + 1, 10);
    }

    function initBook() {
        $('#book').turn({
            pages: numberOfPages,
            width: 960,
            height: 600,
            elevation: 50,
            duration: 1300,
            autoCenter: true,
            acceleration: true,
            gradients: !$.isTouch,
            when: {
                turning: function (e, page, view) {
                    let tp = page;
                    var range = $(this).turn('range', page);
                    // Check if each page is within the book
                    for (tp = range[0]; tp <= range[1]; tp++)
                        addPage(tp, $(this));

                    // 更新滑块位置
                    console.log(getViewNumber($(this), page), getViewNumber($(this), (numberOfPages)))
                    var position = getViewNumber($(this), page) * sliderWidth / getViewNumber($(this), (numberOfPages));
                    cur.css('margin-left', position + 'px');
                },
                start: function (e, pageObj, corner) {
                    var book = $(this);
                    if (pageObj.page == 2)
                        book.css({ backgroundPosition: '482px 0' });
                    else if (pageObj.page == book.turn('pages') - 1)
                        book.css({ backgroundPosition: '472px 0' });
                },
                turned: function () {
                    initImageViewer()
                }
            }
        });
    }

    function initEvents() {
        // 添加导航按钮事件监听
        $('#prev-btn').click(function () {
            $('#book').turn('previous');
        });

        $('#next-btn').click(function () {
            $('#book').turn('next');
        });

        // 滑块拖拽相关代码
        cur.on('mousedown', function (e) {
            isDragging = true;
            startX = e.pageX - parseInt(cur.css('margin-left'));
            // 更新sliderLeft,确保获取最新位置
            sliderLeft = slider.offset().left;
            e.preventDefault(); // 防止文本选中
        });

        $(document).on('mousemove', function (e) {
            if (isDragging) {
                e.preventDefault();
                // 计算相对于slider的位置
                var relativeX = e.pageX - sliderLeft;
                // 限制在slider范围内
                var x = Math.min(Math.max(0, e.pageX - startX), sliderWidth);
                cur.css('margin-left', x + 'px');

                // 计算目标页码
                targetPage = Math.round(x * (numberOfPages - 1) / sliderWidth) + 1;
            }
        });

        $(document).on('mouseup', function (e) {
            if (isDragging && targetPage > 0 && targetPage <= numberOfPages) {
                $('#book').turn('page', targetPage);
            }
            isDragging = false;
        });

        // 防止拖出浏览器窗口时无法触发mouseup
        $(document).on('mouseleave', function (e) {
            if (isDragging && targetPage > 0 && targetPage <= numberOfPages) {
                $('#book').turn('page', targetPage);
            }
            isDragging = false;
        });

        // 添加slider点击事件
        $('#slider-wrap').on('click', function (e) {
            if (!isDragging) {
                // 更新sliderLeft,确保获取最新位置
                sliderLeft = slider.offset().left;
                var clickX = e.pageX - sliderLeft;
                var x = Math.min(Math.max(0, clickX - cur.width() / 2), sliderWidth);
                cur.css('margin-left', x + 'px');

                var page = Math.round(x * (numberOfPages - 1) / sliderWidth) + 1;
                if (page > 0 && page <= numberOfPages) {
                    $('#book').turn('page', page);
                }
            }
        });

        // menu event
        $("#content-table").on('click', () => {
            $('#book').turn('page', 3);
        })
    }

    function initKeydown() {
        $(window).bind('keydown', function (e) {
            if (e.target && e.target.tagName.toLowerCase() != 'input')
                if (e.keyCode == 37)
                    $('#book').turn('previous');
                else if (e.keyCode == 39)
                    $('#book').turn('next');
        });
    }



    $(window).ready(function () {
        initBook();
        initEvents();
        initKeydown();
        setTimeout(() => {
            $('#book').turn('page', 2);
        }, 1300);
    });
}
init()