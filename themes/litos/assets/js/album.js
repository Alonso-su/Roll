/**
 * Album Page JavaScript
 * 相册页面交互功能
 */
(function() {
    'use strict';
    
    // 懒加载图片
    function initLazyLoading() {
        const images = document.querySelectorAll('.photo-img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            img.classList.add('loaded');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
            });
        }
    }
    
    // 初始化ViewImage灯箱
    function initViewImage() {
        if (typeof window.ViewImage !== 'undefined') {
            // 为相册图片初始化ViewImage
            window.ViewImage.init('.photo-grid img');
        }
    }
    
    // 图片加载错误处理
    function handleImageErrors() {
        const images = document.querySelectorAll('.photo-img');
        
        images.forEach(img => {
            img.addEventListener('error', function() {
                this.classList.add('error');
                
                // 如果有父级的photo-card，添加错误状态
                const photoCard = this.closest('.photo-card');
                if (photoCard) {
                    photoCard.classList.add('image-error');
                }
            });
            
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        });
    }
    
    // 键盘导航支持
    function initKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // 如果ViewImage灯箱打开，不处理键盘事件
            if (document.querySelector('.view-image')) {
                return;
            }
            
            const photos = Array.from(document.querySelectorAll('.photo-img'));
            const focusedPhoto = document.activeElement;
            
            if (photos.includes(focusedPhoto)) {
                const currentIndex = photos.indexOf(focusedPhoto);
                let nextIndex = currentIndex;
                
                switch(e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        nextIndex = (currentIndex + 1) % photos.length;
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        nextIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
                        break;
                    case 'Enter':
                    case ' ':
                        focusedPhoto.click();
                        e.preventDefault();
                        return;
                    default:
                        return;
                }
                
                if (nextIndex !== currentIndex) {
                    photos[nextIndex].focus();
                    e.preventDefault();
                }
            }
        });
        
        // 为图片添加tabindex使其可聚焦
        const photos = document.querySelectorAll('.photo-img');
        photos.forEach((photo, index) => {
            photo.setAttribute('tabindex', index === 0 ? '0' : '-1');
            photo.setAttribute('role', 'button');
            photo.setAttribute('aria-label', `查看图片: ${photo.alt || '无标题'}`);
        });
    }
    
    // 性能优化：防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 窗口大小改变时重新计算布局
    function handleResize() {
        // 这里可以添加响应式布局调整逻辑
    }
    
    // 初始化所有功能
    function init() {
        // 检查是否在相册页面
        if (!document.querySelector('.album-container')) {
            return;
        }
        
        initLazyLoading();
        handleImageErrors();
        initKeyboardNavigation();
        
        // 延迟初始化ViewImage，确保ViewImage库已加载
        setTimeout(initViewImage, 100);
        
        // 添加窗口大小改变监听器
        window.addEventListener('resize', debounce(handleResize, 250));
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();