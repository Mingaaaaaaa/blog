var sliderWidth;
var targetPage = 0;
var startX, sliderLeft;
var isDragging = false;
var numberOfPages = 100;

var cur = $('#cur');
var slider = $('#slider');
sliderWidth = slider.width() - cur.width();
sliderLeft = slider.offset().left;

function init() {

    function addPage(page, book) {
        // 	First check if the page is already in the book
        if (!book.turn('hasPage', page)) {
            // Create an element for this page
            var element = $('<div />', { 'class': 'page ' + ((page % 2 == 0) ? 'odd' : 'even'), 'id': 'page-' + page }).html('<i class="loader"></i>');
            // If not then add the page
            book.turn('addPage', element, page);
            // 修改加载逻辑，根据页码加载对应的文件
            $.get(`./src/pages/${page}.html`, function (data) {
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
            duration: 1100,
            autoCenter: true,
            acceleration: true,
            gradients: !$.isTouch,
            turnCorners: true,
            corners: 'all',
            when: {
                turning: function (e, page, view) {
                    let tp = page;
                    var range = $(this).turn('range', page);
                    // Check if each page is within the book
                    for (tp = range[0]; tp <= range[1]; tp++)
                        addPage(tp, $(this));

                    // 如果当前是 0/1，隐藏 pre-dep 和 prev-btn
                    if (page <= 1) {
                        $('#pre-dep, #prev-btn').hide();
                        $('#nex-dep').hide();
                    } else {
                        $('#pre-dep, #prev-btn').fadeIn(700);
                        $('#nex-dep').fadeIn(700);
                    }

                    // 更新滑块位置
                    var position = getViewNumber($(this), page) * sliderWidth / getViewNumber($(this), (numberOfPages));
                    cur.css('margin-left', position + 'px');
                    // 根据总页数调整深度变化的步长，并添加简单过渡

                    let leftDepth = 20 - (page - 1) * (13 / numberOfPages);
                    let rightDepth = 7 + (page - 1) * (13 / numberOfPages);
                    // 渐变透明后调整位置并显示
                    // 动态调整位置并添加缓冲效果
                    $('#pre-dep')
                        .animate({ left: leftDepth + 'px' }, 300);  // 平滑移动到目标位置

                    $('#nex-dep')
                        .animate({ right: rightDepth + 'px' }, 300);

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

    function checkUrlParams() {

        var urlParams = new URLSearchParams(window.location.search);
        var page = urlParams.get('page');
        if (page && page > 0 && page <= numberOfPages && !isNaN(page)) {
            $('#book').turn('page', page);
        } else {
            $('#book').turn('page', 2);
        }
    }

    $(window).ready(function () {
        initBook();
        initEvents();
        initKeydown();
        setTimeout(() => {
            checkUrlParams();
        }, 1000);
    });
}
init()