// Recent Posts 背景图片处理
document.addEventListener('DOMContentLoaded', function() {
    const recentPostCards = document.querySelectorAll('.recent-post-card');
    
    recentPostCards.forEach(card => {
        const featuredImage = card.getAttribute('data-featured-image');
        
        if (featuredImage) {
            // 预加载图片
            const img = new Image();
            img.onload = function() {
                card.style.setProperty('--bg-image', `url(${featuredImage})`);
                card.classList.add('has-image');
            };
            img.src = featuredImage;
        }
    });
});