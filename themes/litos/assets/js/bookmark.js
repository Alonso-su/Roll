// Bookmark page JavaScript with Raindrop.io API integration
class BookmarkPage {
    constructor() {
        this.bookmarkItems = [];
        this.raindropApiUrl = 'https://api.raindrop.io/rest/v1/raindrops/0';
        this.apiToken = '';
        this.config = null;
        this.fallbackData = null;
        this.allBookmarks = []; // 存储所有书签数据
        this.currentFilter = 'all'; // 当前筛选状态
        this.currentSearchTerm = ''; // 当前搜索关键词
        this.init();
    }

    async init() {
        await this.loadConfigFromHugo();
        
        await this.loadBookmarks();
        this.setupRetryButton();
    }

    async loadConfigFromHugo() {
        try {
            // 等待配置完全加载
            await this.waitForConfig();
            
            // 从Hugo配置中获取Raindrop.io设置
            const siteConfig = window.siteConfig || {};
            const raindropConfig = siteConfig.raindrop || {};
            
            if (raindropConfig && raindropConfig.enable !== false) {
                this.raindropApiUrl = raindropConfig.api_url || this.raindropApiUrl;
                this.apiToken = raindropConfig.token || this.apiToken;
            }
            
            // 加载回退数据
            await this.loadFallbackData();
            
        } catch (error) {
            console.warn('Failed to load Hugo config:', error);
        }
    }

    async waitForConfig() {
        return new Promise((resolve) => {
            const checkConfig = () => {
                if (window.siteConfig) {
                    resolve();
                } else {
                    setTimeout(checkConfig, 50);
                }
            };
            checkConfig();
        });
    }

    async loadFallbackData() {
        // 内置的回退书签数据
        this.fallbackData = {
            "技术开发": [
                {
                    "title": "GitHub",
                    "url": "https://github.com",
                    "description": "全球最大的代码托管平台",
                    "icon": "ri-github-fill"
                },
                {
                    "title": "Stack Overflow", 
                    "url": "https://stackoverflow.com",
                    "description": "程序员问答社区",
                    "icon": "ri-stack-overflow-line"
                },
                {
                    "title": "MDN Web Docs",
                    "url": "https://developer.mozilla.org",
                    "description": "Web开发文档资源",
                    "icon": "ri-global-line"
                }
            ],
            "设计创意": [
                {
                    "title": "Dribbble",
                    "url": "https://dribbble.com",
                    "description": "设计师作品展示平台", 
                    "icon": "ri-basketball-line"
                },
                {
                    "title": "Behance",
                    "url": "https://behance.net",
                    "description": "创意设计作品集",
                    "icon": "ri-behance-line"
                }
            ],
            "生活日常": [
                {
                    "title": "YouTube",
                    "url": "https://youtube.com",
                    "description": "视频分享平台",
                    "icon": "ri-youtube-line"
                },
                {
                    "title": "Spotify",
                    "url": "https://spotify.com", 
                    "description": "音乐流媒体服务",
                    "icon": "ri-spotify-line"
                }
            ]
        };
    }

    async loadBookmarks() {
        const loadingEl = document.getElementById('bookmark-loading');
        const errorEl = document.getElementById('bookmark-error');
        const categoriesEl = document.getElementById('bookmark-categories');

        try {
            // 显示加载状态
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';
            categoriesEl.innerHTML = '';

            let bookmarks = [];
            
            // 优先尝试从Raindrop.io加载
            try {
                bookmarks = await this.fetchRaindropBookmarks();
            } catch (raindropError) {
                // 使用回退数据
                if (this.fallbackData) {
                    bookmarks = this.convertFallbackToRaindropFormat(this.fallbackData);
                } else {
                    throw new Error('No fallback data available');
                }
            }
            
            // 存储所有书签数据
            this.allBookmarks = bookmarks;
            
            // 按分类组织书签
            const categorizedBookmarks = this.categorizeBookmarks(bookmarks);
            
            // 渲染书签
            this.renderBookmarks(categorizedBookmarks);
            
            // 初始化筛选和搜索功能
            this.setupSearchAndFilter();
            
            // 隐藏加载状态
            loadingEl.style.display = 'none';
            
            // 初始化交互功能
            this.setupHoverEffects();
            this.setupClickTracking();
            this.setupKeyboardNavigation();
            
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
        }
    }

    async fetchRaindropBookmarks() {
        const token = this.getApiToken();
        
        if (!token || token === 'YOUR_RAINDROP_API_TOKEN_HERE') {
            throw new Error('Raindrop.io API Token not configured');
        }

        try {
            // 根据Raindrop.io官方文档，使用正确的API端点获取所有书签
            // https://developer.raindrop.io/v1/raindrops/get-all-raindrops
            let allBookmarks = [];
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
                const apiUrl = `https://api.raindrop.io/rest/v1/raindrops/0?page=${page}&perpage=50`;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'SUUS-Blog/1.0'
                    }
                });

                if (!response.ok) {
                    let errorMessage = `Raindrop API error: ${response.status}`;
                    
                    // 根据状态码提供更详细的错误信息
                    if (response.status === 401) {
                        errorMessage = 'Raindrop API: Unauthorized - Invalid or expired token';
                    } else if (response.status === 403) {
                        errorMessage = 'Raindrop API: Forbidden - Token does not have required permissions';
                    } else if (response.status === 429) {
                        errorMessage = 'Raindrop API: Rate limit exceeded';
                    }
                    
                    // 尝试获取错误详情
                    try {
                        const errorData = await response.json();
                        errorMessage += ` - ${errorData.error || errorData.message || ''}`;
                    } catch (e) {
                        // 忽略JSON解析错误
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                const items = data.items || [];
                
                if (items.length === 0) {
                    hasMore = false;
                } else {
                    allBookmarks = allBookmarks.concat(items);
                    
                    // 检查是否还有更多页
                    if (data.count && data.count <= allBookmarks.length) {
                        hasMore = false;
                    }
                    
                    page++;
                }
            }
            
            return allBookmarks;
        } catch (error) {
            // 如果是网络错误，提供更友好的错误信息
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to Raindrop.io API');
            }
            
            throw error;
        }
    }

    convertFallbackToRaindropFormat(fallbackData) {
        const bookmarks = [];
        
        Object.entries(fallbackData).forEach(([category, items]) => {
            items.forEach(item => {
                bookmarks.push({
                    title: item.title,
                    link: item.url,
                    excerpt: item.description,
                    tags: [],
                    created: new Date().toISOString(),
                    lastUpdate: new Date().toISOString(),
                    collection: {
                        title: category
                    }
                });
            });
        });
        
        return bookmarks;
    }

    getApiToken() {
        // 检查所有可能的Token来源
        let validToken = null;
        
        // 1. 检查实例Token
        if (this.apiToken && this.apiToken.length > 10) {
            validToken = this.apiToken;
        }
        // 2. 检查Hugo配置Token - 使用更安全的访问方式
        else if (window.siteConfig && window.siteConfig.raindrop && window.siteConfig.raindrop.token && window.siteConfig.raindrop.token.length > 10) {
            validToken = window.siteConfig.raindrop.token;
        }
        // 3. 检查全局配置Token
        else if (window.RAINDROP_CONFIG && window.RAINDROP_CONFIG.token) {
            validToken = window.RAINDROP_CONFIG.token;
        }
        // 4. 检查data属性Token
        else {
            const container = document.getElementById('raindrop-bookmarks');
            if (container && container.dataset.token) {
                validToken = container.dataset.token;
            }
        }
        
        return validToken;
    }

    categorizeBookmarks(bookmarks) {
        const categories = {};
        
        bookmarks.forEach(bookmark => {
            const category = bookmark.collection?.title || '未分类';
            
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push({
                title: bookmark.title,
                url: bookmark.link,
                description: bookmark.excerpt || bookmark.title,
                icon: this.getIconForDomain(bookmark.link),
                tags: bookmark.tags || [],
                created: bookmark.created,
                lastUpdate: bookmark.lastUpdate,
                important: bookmark.important || bookmark.favorite || false
            });
        });
        
        return categories;
    }

    getIconForDomain(url) {
        try {
            const domain = new URL(url).hostname;
            const iconMap = {
                'github.com': 'ri-github-fill',
                'stackoverflow.com': 'ri-stack-overflow-line',
                'developer.mozilla.org': 'ri-global-line',
                'dribbble.com': 'ri-basketball-line',
                'behance.net': 'ri-behance-line',
                'youtube.com': 'ri-youtube-line',
                'spotify.com': 'ri-spotify-line',
                'twitter.com': 'ri-twitter-line',
                'facebook.com': 'ri-facebook-line',
                'instagram.com': 'ri-instagram-line',
                'linkedin.com': 'ri-linkedin-line',
                'medium.com': 'ri-medium-line',
                'reddit.com': 'ri-reddit-line',
                'pinterest.com': 'ri-pinterest-line'
            };
            
            for (const [domainPattern, icon] of Object.entries(iconMap)) {
                if (domain.includes(domainPattern)) {
                    return icon;
                }
            }
        } catch (error) {
            console.warn('Failed to parse URL for icon:', url);
        }
        
        return 'ri-global-line'; // 默认图标
    }

    renderBookmarks(categorizedBookmarks) {
        const categoriesEl = document.getElementById('bookmark-categories');
        
        // 计算总书签数
        let totalBookmarks = 0;
        Object.values(categorizedBookmarks).forEach(bookmarks => {
            totalBookmarks += bookmarks.length;
        });
        
        // 更新书签总数显示
        const countSpan = document.querySelector('.bookmark-total-count');
        if (countSpan) {
            countSpan.textContent = ' (' + totalBookmarks + ')';
        }
        
        let isFirstCategory = true;
        let itemIndex = 0;
        
        Object.entries(categorizedBookmarks).forEach(([categoryName, bookmarks]) => {
            // 在第一个分类之前添加搜索和筛选功能
            if (isFirstCategory) {
                const searchControls = this.createSearchAndFilterControls();
                categoriesEl.appendChild(searchControls);
                isFirstCategory = false;
            }
            
            // 创建书签列表
            const section = document.createElement('section');
            section.className = 'p-4';
            
            const list = document.createElement('ul');
            list.className = 'bookmark-list';
            
            bookmarks.forEach(bookmark => {
                const bookmarkEl = this.createBookmarkElement(bookmark);
                // 为每个书签项添加延迟动画
                bookmarkEl.style.animationDelay = `${itemIndex * 0.05}s`;
                list.appendChild(bookmarkEl);
                itemIndex++;
            });
            
            section.appendChild(list);
            categoriesEl.appendChild(section);
        });
    }

    createSearchAndFilterControls() {
        // 创建搜索和筛选容器
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'bookmark-controls-container';
        
        const controls = document.createElement('div');
        controls.className = 'bookmark-controls';
        
        // 搜索输入框
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'search-input-wrapper';
        
        const searchIcon = document.createElement('i');
        searchIcon.className = 'ri-search-line search-icon';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'bookmark-search';
        searchInput.placeholder = '搜索书签...';
        searchInput.className = 'search-input';
        
        const clearSearchBtn = document.createElement('button');
        clearSearchBtn.id = 'clear-search';
        clearSearchBtn.className = 'clear-search-btn';
        clearSearchBtn.style.display = 'none';
        clearSearchBtn.innerHTML = '<i class="ri-close-line"></i>';
        
        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        searchWrapper.appendChild(clearSearchBtn);
        searchContainer.appendChild(searchWrapper);
        
        // 标签筛选
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        
        const tagFilter = document.createElement('div');
        tagFilter.id = 'tag-filter';
        tagFilter.className = 'tag-filter';
        
        filterContainer.appendChild(tagFilter);
        
        // 组装所有控件（搜索框在标签筛选下方）
        controls.appendChild(filterContainer);
        controls.appendChild(searchContainer);
        controlsContainer.appendChild(controls);
        
        return controlsContainer;
    }

    createBookmarkElement(bookmark) {
        const listItem = document.createElement('li');
        listItem.className = 'bookmark-list-item';
        
        // 获取网站favicon
        const faviconUrl = this.getFaviconUrl(bookmark.url);
        
        // 检查是否有备注信息
        const hasNotes = bookmark.excerpt && bookmark.excerpt.trim().length > 0;
        
        // 获取域名用于调试
        let domain = '';
        try {
            domain = new URL(bookmark.url).hostname;
        } catch (error) {
            console.warn('Failed to parse domain for:', bookmark.url);
        }
        

        
        listItem.innerHTML = `
            <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="bookmark-link">
                ${bookmark.important ? `
                <div class="favorite-star">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffa500" stroke="#ffa500" stroke-width="1.5">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </div>
                ` : ''}
                <div class="bookmark-avatar">
                    <img src="${faviconUrl}" alt="${this.escapeHtml(bookmark.title)}" class="favicon" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    <div class="fallback-icon" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                </div>
                <div class="bookmark-content">
                    <div class="bookmark-title-row">
                        <span class="bookmark-title">${this.escapeHtml(bookmark.title)}</span>
                        ${bookmark.tags.length > 0 ? `<span class="bookmark-tags">${bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</span>` : ''}
                    </div>
                    ${hasNotes ? `<div class="bookmark-notes">${this.escapeHtml(bookmark.excerpt)}</div>` : ''}
                    <div class="bookmark-meta">
                        ${bookmark.domain ? `<span class="meta-item">${bookmark.domain}</span>` : ''}
                    </div>
                </div>
            </a>
        `;
        
        return listItem;
    }

    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            
            // 使用unavatar.io服务获取网站头像，允许回退
            const faviconUrl = `https://favicon.im/${domain}`;
            
            return faviconUrl;
        } catch (error) {
            return '';
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return '今天';
            } else if (diffDays <= 7) {
                return `${diffDays}天前`;
            } else if (diffDays <= 30) {
                return `${Math.floor(diffDays / 7)}周前`;
            } else {
                return date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return '';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupHoverEffects() {
        this.bookmarkItems = document.querySelectorAll('.bookmark-item');
        
        this.bookmarkItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.animateHover(item, true);
            });
            
            item.addEventListener('mouseleave', () => {
                this.animateHover(item, false);
            });
        });
    }

    animateHover(item, isHovering) {
        const link = item.querySelector('.bookmark-link');
        const icon = item.querySelector('.bookmark-icon i');
        
        if (isHovering) {
            // Add hover animation
            item.style.transform = 'translateY(-2px) scale(1.02)';
            icon.style.transform = 'scale(1.1)';
            icon.style.color = 'var(--color-primary)';
        } else {
            // Reset animation
            item.style.transform = 'translateY(0) scale(1)';
            icon.style.transform = 'scale(1)';
            icon.style.color = 'var(--color-primary)';
        }
    }

    setupClickTracking() {
        this.bookmarkItems.forEach(item => {
            const link = item.querySelector('.bookmark-link');
            link.addEventListener('click', (e) => {
                this.trackBookmarkClick(link.href);
            });
        });
    }

    trackBookmarkClick(url) {
        // Track bookmark clicks for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'bookmark_click', {
                'event_category': 'Bookmark',
                'event_label': url,
                'value': 1
            });
        }
        
        // Umami analytics
        if (typeof umami !== 'undefined') {
            umami.track('bookmark_click', { url: url });
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.bookmarkItems.length > 0) {
                this.handleTabNavigation(e);
            }
        });
    }

    handleTabNavigation(e) {
        const activeElement = document.activeElement;
        const isBookmarkLink = activeElement.closest('.bookmark-link');
        
        if (isBookmarkLink) {
            e.preventDefault();
            
            const currentIndex = Array.from(this.bookmarkItems).findIndex(item => 
                item.contains(activeElement)
            );
            
            let nextIndex;
            if (e.shiftKey) {
                // Shift+Tab: move to previous
                nextIndex = currentIndex > 0 ? currentIndex - 1 : this.bookmarkItems.length - 1;
            } else {
                // Tab: move to next
                nextIndex = currentIndex < this.bookmarkItems.length - 1 ? currentIndex + 1 : 0;
            }
            
            this.bookmarkItems[nextIndex].querySelector('.bookmark-link').focus();
        }
    }

    setupSearchAndFilter() {
        // 初始化搜索功能
        this.setupSearch();
        
        // 初始化标签筛选功能
        this.setupTagFilter();
        
        // 初始化清除按钮
        this.setupClearButtons();
    }

    setupSearch() {
        const searchInput = document.getElementById('bookmark-search');
        const clearSearchBtn = document.getElementById('clear-search');
        
        if (!searchInput) return;
        
        // 搜索输入事件
        searchInput.addEventListener('input', (e) => {
            this.currentSearchTerm = e.target.value.trim().toLowerCase();
            this.updateClearSearchButton();
            this.applyFilters();
        });
        
        // 清除搜索按钮
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.currentSearchTerm = '';
                this.updateClearSearchButton();
                this.applyFilters();
            });
        }
    }

    setupTagFilter() {
        const tagFilterContainer = document.getElementById('tag-filter');
        if (!tagFilterContainer) return;
        
        // 收集所有标签
        const allTags = this.getAllTags();
        
        // 渲染标签筛选按钮
        this.renderTagFilterButtons(allTags, tagFilterContainer);
        
        // 设置标签点击事件
        this.setupTagClickEvents();
    }

    getAllTags() {
        const tags = new Map();
        
        this.allBookmarks.forEach(bookmark => {
            if (bookmark.tags && Array.isArray(bookmark.tags)) {
                bookmark.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        const tagName = tag.trim().toLowerCase();
                        tags.set(tagName, (tags.get(tagName) || 0) + 1);
                    }
                });
            }
        });
        
        // 转换为数组并按标签名称排序
        return Array.from(tags.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => a.tag.localeCompare(b.tag));
    }

    renderTagFilterButtons(tags, container) {
        // 添加"全部"标签
        const allTagsButton = `
            <button class="tag-filter-btn active" data-tag="all">
                全部
            </button>
        `;
        
        if (tags.length === 0) {
            container.innerHTML = allTagsButton + '<div class="no-tags">暂无标签</div>';
            return;
        }
        
        const tagButtons = tags.map(tagInfo => `
            <button class="tag-filter-btn" data-tag="${this.escapeHtml(tagInfo.tag)}">
                ${this.escapeHtml(tagInfo.tag)}
            </button>
        `).join('');
        
        container.innerHTML = allTagsButton + tagButtons;
    }

    setupTagClickEvents() {
        const tagButtons = document.querySelectorAll('.tag-filter-btn');
        
        tagButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tag = e.currentTarget.dataset.tag;
                this.toggleTagFilter(tag);
            });
        });
    }

    toggleTagFilter(tag) {
        const button = document.querySelector(`[data-tag="${tag}"]`);
        
        if (this.currentFilter === tag) {
            // 取消选中
            this.currentFilter = 'all';
            button.classList.remove('active');
        } else {
            // 选中新标签
            this.currentFilter = tag;
            
            // 移除其他标签的选中状态
            document.querySelectorAll('.tag-filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            button.classList.add('active');
        }
        
        this.applyFilters();
    }

    setupClearButtons() {
        const clearFilterBtn = document.getElementById('clear-filter');
        
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    clearAllFilters() {
        // 清除搜索
        const searchInput = document.getElementById('bookmark-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 清除标签筛选
        this.currentFilter = 'all';
        this.currentSearchTerm = '';
        
        // 移除所有标签的选中状态
        document.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 更新UI
        this.updateClearSearchButton();
        this.applyFilters();
    }

    updateClearSearchButton() {
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = this.currentSearchTerm ? 'block' : 'none';
        }
        
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.style.display = this.currentFilter !== 'all' ? 'block' : 'none';
        }
    }

    applyFilters() {
        const bookmarkItems = document.querySelectorAll('.bookmark-list-item');
        const categoryHeadings = document.querySelectorAll('.bookmark-category-heading');
        
        let visibleItemsCount = 0;
        
        // 应用筛选逻辑
        bookmarkItems.forEach(item => {
            const title = item.querySelector('.bookmark-title')?.textContent?.toLowerCase() || '';
            const description = item.querySelector('.bookmark-notes')?.textContent?.toLowerCase() || '';
            const tags = Array.from(item.querySelectorAll('.tag')).map(tag => tag.textContent?.toLowerCase());
            
            const matchesSearch = !this.currentSearchTerm || 
                title.includes(this.currentSearchTerm) || 
                description.includes(this.currentSearchTerm);
            
            const matchesTag = this.currentFilter === 'all' || 
                tags.includes(this.currentFilter);
            
            if (matchesSearch && matchesTag) {
                item.classList.remove('filtered-out');
                visibleItemsCount++;
            } else {
                item.classList.add('filtered-out');
            }
        });
        
        // 更新UI状态
        this.updateClearSearchButton();
        
        // 如果没有可见项目，显示空状态
        this.showEmptyState(visibleItemsCount === 0);
    }

    showEmptyState(isEmpty) {
        const categoriesEl = document.getElementById('bookmark-categories');
        let emptyStateEl = document.getElementById('bookmark-empty-state');
        
        if (isEmpty) {
            if (!emptyStateEl) {
                emptyStateEl = document.createElement('div');
                emptyStateEl.id = 'bookmark-empty-state';
                emptyStateEl.className = 'bookmark-empty-state';
                emptyStateEl.innerHTML = `
                    <div class="empty-icon">
                        <i class="ri-search-line"></i>
                    </div>
                    <p>没有找到匹配的书签</p>
                    <button class="clear-all-filters-btn">
                        清除所有筛选条件
                    </button>
                `;
                
                // 添加清除按钮事件
                const clearBtn = emptyStateEl.querySelector('.clear-all-filters-btn');
                clearBtn.addEventListener('click', () => {
                    this.clearAllFilters();
                });
                
                categoriesEl.appendChild(emptyStateEl);
            }
            emptyStateEl.style.display = 'block';
        } else if (emptyStateEl) {
            emptyStateEl.style.display = 'none';
        }
    }

    setupRetryButton() {
        const retryButton = document.getElementById('retry-loading');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadBookmarks();
            });
        }
        
    }

    // Utility method to add new bookmarks dynamically
    addBookmark(category, title, url, description, iconClass = 'ri-global-line') {
        const categoryElement = document.querySelector(`.bookmark-category-heading:contains("${category}")`);
        if (!categoryElement) return;
        
        const grid = categoryElement.nextElementSibling?.querySelector('.bookmark-grid');
        if (!grid) return;
        
        const newBookmark = this.createBookmarkElement({
            title,
            url,
            description,
            icon: iconClass,
            tags: []
        });
        
        grid.appendChild(newBookmark);
        this.bookmarkItems = document.querySelectorAll('.bookmark-item'); // Refresh the list
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('raindrop-bookmarks')) {
        new BookmarkPage();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkPage;
}