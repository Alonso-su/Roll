// 修复redirect.js的外部链接处理
// 防止404页面按钮被误认为外部链接

(function() {
    'use strict';
    
    // 重写handleExternalLinks函数，添加更多排除条件
    function handleExternalLinksFixed() {
        // Skip if we're on the redirect page
        if (window.location.pathname.includes('/redirect/')) {
            return;
        }
        
        const links = document.querySelectorAll('a[href^="http"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Skip if already processed by render-link.html (contains /redirect/)
            if (href.includes('/redirect/')) return;
            
            // Skip if has data-no-redirect attribute
            if (link.hasAttribute('data-no-redirect')) return;
            
            // Skip if has no-external-icon class
            if (link.classList.contains('no-external-icon')) return;
            
            // Skip if has internal-link class
            if (link.classList.contains('internal-link')) return;
            
            try {
                const url = new URL(href);
                const currentDomain = window.location.hostname;
                
                // Skip if it's the same domain
                if (url.hostname === currentDomain) return;
                
                // Skip if already has redirect handling
                if (link.hasAttribute('data-redirect-handled')) return;
                
                // Skip if has target="_blank"
                if (link.getAttribute('target') === '_blank') return;
                
                // Add click handler for external links
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (window.redirectTo) {
                        window.redirectTo(href);
                    } else {
                        window.open(href, '_blank');
                    }
                });
                
                // Mark as handled
                link.setAttribute('data-redirect-handled', 'true');
                
                // Add visual indicator for external links
                if (!link.querySelector('.external-link-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'external-link-icon';
                    icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 0.25rem; opacity: 0.6;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    link.appendChild(icon);
                }
                
            } catch (e) {
                // Invalid URL, skip
            }
        });
    }
    
    // 清理已有的外部链接图标（针对404页面）
    function cleanupExternalIcons() {
        document.querySelectorAll('.no-external-icon .external-link-icon, [data-no-redirect] .external-link-icon').forEach(function(icon) {
            icon.remove();
        });
    }
    
    // 初始化
    function init() {
        cleanupExternalIcons();
        
        // 监听DOM变化
        const observer = new MutationObserver(function(mutations) {
            let shouldCleanup = false;
            
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('external-link-icon')) {
                            const parent = node.parentElement;
                            if (parent && (parent.classList.contains('no-external-icon') || parent.hasAttribute('data-no-redirect'))) {
                                shouldCleanup = true;
                            }
                        }
                        // 检查子节点
                        if (node.querySelector && node.querySelector('.external-link-icon')) {
                            const icons = node.querySelectorAll('.no-external-icon .external-link-icon, [data-no-redirect] .external-link-icon');
                            if (icons.length > 0) {
                                shouldCleanup = true;
                            }
                        }
                    }
                });
            });
            
            if (shouldCleanup) {
                setTimeout(cleanupExternalIcons, 10);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 运行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();