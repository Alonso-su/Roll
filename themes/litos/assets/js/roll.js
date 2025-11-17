// Roll Page JavaScript - 友情链接页面交互
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在roll页面
    if (!document.querySelector('.roll-container')) return;

    // 随机排序友链卡片
    function shuffleCards() {
        const friendsGroups = document.querySelectorAll('.friends-grid');
        
        friendsGroups.forEach(grid => {
            const cards = Array.from(grid.children);
            
            // Fisher-Yates 洗牌算法
            for (let i = cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                grid.appendChild(cards[j]);
            }
            
            // 洗牌完成后显示网格
            setTimeout(() => {
                grid.classList.add('loaded');
            }, 50);
        });
    }

    // 添加卡片点击统计（可选）
    function trackCardClicks() {
        const friendLinks = document.querySelectorAll('.friend-link');
        
        friendLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const friendName = this.querySelector('.friend-name').textContent;
                
                // 这里可以添加统计代码，比如发送到Google Analytics
                // gtag('event', 'click', {
                //     event_category: 'friend_link',
                //     event_label: friendName
                // });
            });
        });
    }

    // 图片加载错误处理
    function handleImageErrors() {
        const avatarImages = document.querySelectorAll('.friend-avatar img');
        
        avatarImages.forEach(img => {
            img.addEventListener('error', function() {
                // 如果图片加载失败，使用默认头像
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEM4Ljk1IDIwIDAgMTEuMDUgMCAyMFM4Ljk1IDQwIDIwIDQwUzQwIDMxLjA1IDQwIDIwUzMxLjA1IDAgMjAgMFpNMjAgMzZDMTEuMTYgMzYgNCAyOC44NCA0IDIwUzExLjE2IDQgMjAgNFMyOCAxMS4xNiAyOCAyMFMyOC44NCAzNiAyMCAzNloiIGZpbGw9IiM5QjlCQTAiLz4KPC9zdmc+';
                this.alt = '默认头像';
            });
        });
    }

    // 懒加载优化
    function setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            const lazyImages = document.querySelectorAll('.friend-avatar img[loading="lazy"]');
            lazyImages.forEach(img => {
                img.classList.add('lazy');
                imageObserver.observe(img);
            });
        }
    }

    // 搜索功能（可选）
    function setupSearch() {
        // 创建搜索框
        const searchContainer = document.createElement('div');
        searchContainer.className = 'roll-search mb-4';
        searchContainer.innerHTML = `
            <input type="text" 
                   id="friend-search" 
                   placeholder="搜索友链..." 
                   class="search-input">
        `;

        // 插入到页面描述后面
        const description = document.querySelector('.roll-description');
        if (description) {
            description.after(searchContainer);
        }

        // 搜索功能
        const searchInput = document.getElementById('friend-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const friendCards = document.querySelectorAll('.friend-card');

                friendCards.forEach(card => {
                    const name = card.querySelector('.friend-name').textContent.toLowerCase();
                    const intro = card.querySelector('.friend-intro').textContent.toLowerCase();
                    
                    if (name.includes(searchTerm) || intro.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }
    }

    // 初始化所有功能
    function init() {
        // 随机排序友链
        shuffleCards();
        
        // 设置点击统计
        trackCardClicks();
        
        // 处理图片错误
        handleImageErrors();
        
        // 设置懒加载
        setupLazyLoading();
        
        // 设置搜索功能（可选）
        // setupSearch();
    }

    // 启动初始化
    init();
});