var sliderWidth;
var targetPage = 0;
var startX, sliderLeft;
var isDragging = false;

var cur = $('#cur');
var slider = $('#slider');
sliderWidth = slider.width() - cur.width();
sliderLeft = slider.offset().left;

function init() {

    function addPage(page, book) {
        if (!book.turn('hasPage', page)) {
            var element = $('<div />', { 'class': 'page ' + ((page % 2 == 0) ? 'odd' : 'even'), 'id': 'page-' + page }).html('<i class="loader"></i>');
            book.turn('addPage', element, page);
            $.get(`./src/pages/${page}.html`, function (data) {
                element.html(data);
            }).fail(function () {

                element.html('<div class="data">Data for page ' + page + '</div>');
            });
        }
    }

    function getViewNumber(book, page) {
        return Math.floor(parseInt((page || book.turn('page')) / 2 + 1, 10));
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
                    let range = $(this).turn('range', page);
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
                    if (page >= numberOfPages) {
                        $('#next-btn').hide();
                    }

                    // 更新滑块位置
                    let position = getViewNumber($(this), page) * sliderWidth / getViewNumber($(this), (numberOfPages));
                    cur.css('margin-left', page == 1 ? 0 : position + 'px');

                    // 根据总页数调整深度变化的步长，并添加简单过渡
                    let leftDepth = 20 - (page - 1) * (13 / numberOfPages);
                    let rightDepth = 7 + (page - 1) * (13 / numberOfPages);
                    $('#pre-dep')
                        .animate({ left: leftDepth + 'px' }, 300);  // 平滑移动到目标位置
                    $('#nex-dep')
                        .animate({ right: rightDepth + 'px' }, 300);
                },
                start: function () {
                    hljs.highlightAll()
                },
                turned: function (e, page) {
                    initImageViewer()
                    if (page === 2) {
                        let svgPath = `./src/assets/me.svg`;
                        $('#me-svg').attr('src', svgPath)
                    }
                }
            }
        });
    }

    function initNaviEvents() {
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

        // keyboade navi
        $(window).bind('keydown', function (e) {
            if (e.target && e.target.tagName.toLowerCase() != 'input')
                if (e.keyCode == 37)
                    $('#book').turn('previous');
                else if (e.keyCode == 39)
                    $('#book').turn('next');
        });
        initTouchNavigation()
    }
    function initTouchNavigation() {
        let isScrolling = false; // 滚动节流标志
        // 监听滚轮事件（触摸板）
        $(document).on('wheel', function (e) {
            e.preventDefault(); // 屏蔽浏览器默认行为
            if (isScrolling) return; // 如果正在翻页中，直接返回

            const deltaX = e.originalEvent.deltaX;

            if (deltaX > 50 && !$(e.target).is('code')) {
                isScrolling = true;
                $('#book').turn('next');
                resetScrollState(); // 重置滚动状态
            } else if (deltaX < -50 && !$(e.target).is('code')) {
                isScrolling = true;
                $('#book').turn('previous');
                resetScrollState(); // 重置滚动状态
            }
        });

        function resetScrollState() {
            setTimeout(() => {
                isScrolling = false; // 解锁滚动翻页
            }, 500); // 设置节流间隔时间，单位毫秒
        }
    }

    $(window).ready(function () {
        initBook();
        initNaviEvents();
    });
}
init()