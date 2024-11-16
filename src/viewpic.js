function initImageViewer() {
    // close model
    document.addEventListener('click', function (e) {
        let modal = document.querySelector('.modal')
        if (modal) {
            document.body.removeChild(modal);
        }
    });
    // init pic
    const images = document.querySelectorAll('img');
    images.forEach(image => {
        image.addEventListener('click', function (e) {
            // 检查是否已经存在模态框
            if (document.querySelector('.modal'))
                return;

            // 创建一个模态框
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.style = `
                position: fixed; 
                z-index: 100; 
                width: 40%; 
                height: 50%; 
                background: rgba(0, 0, 0, 0.5); 
                display: block; 
                opacity: 0;
                padding:14px;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                transition: all 0.5s ease-in-out;
            `;
            modal.style.transform = 'translate(-50%, -50%) scale(0)';
            document.body.appendChild(modal);
            // 创建一个图片元素
            const modalImg = document.createElement('img');
            modalImg.src = this.src;
            modalImg.style = "max-width: 100%; max-height: 100%; margin: auto; display: block;";
            modal.appendChild(modalImg);

            // 弹窗动画，从点击位置移动到中心
            setTimeout(() => {
                modal.style.transform = 'translate(-50%, -50%) scale(1)';
                modal.style.opacity = '1';
                modal.style.left = '50%';
                modal.style.top = '50%';
            }, 0);

            e.stopPropagation();
        });
    });
}

initImageViewer();