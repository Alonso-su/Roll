/**
 * Post ViewImage - 专门用于文章详情页的图片灯箱预览
 * 只在文章详情页生效，排除特色图片
 */
(function() {
    'use strict';
    
    // 检查是否为文章详情页
    function isPostPage() {
        return document.querySelector('.post-article') !== null;
    }
    
    // 初始化ViewImage，只在文章详情页生效
    function initPostViewImage() {
        if (!isPostPage()) {
            return;
        }
        
        // 确保ViewImage已加载
        if (typeof window.ViewImage === 'undefined') {
            return;
        }
        
        // 设置目标选择器：只选择文章内容中的图片，排除特色图片和 music 短代码图片
        const target = '.post-content img:not(.music-shortcode img):not(.music-shortcode-cover):not(.music-shortcode-link-icon)';
        
        // 初始化ViewImage，只针对文章内容中的图片
        window.ViewImage.init(target);
        
        // 为文章内容区域添加view-image属性
        const postContent = document.querySelector('.post-content');
        if (postContent) {
            postContent.setAttribute('view-image', '');
        }
        
        // 为文章内容中的图片添加title属性，提供更好的用户体验
        // 排除 music 短代码中的图片
        const contentImages = document.querySelectorAll('.post-content img:not(.music-shortcode img):not(.music-shortcode-cover):not(.music-shortcode-link-icon)');
        contentImages.forEach(img => {
            if (!img.hasAttribute('title') && !img.hasAttribute('no-view')) {
                img.setAttribute('title', '点击查看大图');
            }
        });
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPostViewImage);
    } else {
        initPostViewImage();
    }
})();