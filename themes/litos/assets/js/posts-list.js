// 文章列表无限滚动功能
document.addEventListener('DOMContentLoaded', function () {
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadMoreTrigger = document.getElementById('load-more-trigger');
    const postsContainer = document.getElementById('posts-container');
    const hiddenPosts = document.getElementById('hidden-posts');

    if (!loadMoreTrigger || !postsContainer || !hiddenPosts) {
        return; // 没有必要元素，退出
    }

    let isLoading = false;
    let currentIndex = 0;
    const hiddenPostsArray = Array.from(hiddenPosts.children);
    const postsPerLoad = 6; // 每次加载6篇文章

    // 创建 Intersection Observer 来监听触发器
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && currentIndex < hiddenPostsArray.length && !isLoading) {
                loadMorePosts();
            }
        });
    }, {
        rootMargin: '100px' // 提前100px开始加载
    });

    observer.observe(loadMoreTrigger);

    function loadMorePosts() {
        if (isLoading || currentIndex >= hiddenPostsArray.length) return;

        isLoading = true;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        // 模拟网络延迟
        setTimeout(function () {
            const endIndex = Math.min(currentIndex + postsPerLoad, hiddenPostsArray.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const post = hiddenPostsArray[i].cloneNode(true);
                post.classList.add('fade-in');

                // 延迟添加以创建交错动画效果
                setTimeout(function () {
                    postsContainer.appendChild(post);
                }, (i - currentIndex) * 50);
            }

            currentIndex = endIndex;
            isLoading = false;

            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            // 如果没有更多内容，移除触发器
            if (currentIndex >= hiddenPostsArray.length) {
                observer.unobserve(loadMoreTrigger);
                loadMoreTrigger.remove();
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        }, 300); // 300ms 延迟模拟加载
    }
});