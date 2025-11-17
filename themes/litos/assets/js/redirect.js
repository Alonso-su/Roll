// External Link Redirect Utility
// 外链跳转工具函数

(function() {
    'use strict';
    
    // Create redirect function
    window.redirectTo = function(url) {
        if (!url) {
            return;
        }
        
        // Validate URL
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                throw new Error('Invalid protocol');
            }
        } catch (e) {
            return;
        }
        
        // Check if it's an external URL
        const currentDomain = window.location.hostname;
        const targetDomain = new URL(url).hostname;
        
        if (currentDomain === targetDomain) {
            // Internal link, redirect directly
            window.location.href = url;
        } else {
            // External link, go through redirect page
            const redirectUrl = '/redirect/?url=' + encodeURIComponent(url);
            window.location.href = redirectUrl;
        }
    };
    
    // Auto-handle external links
    function handleExternalLinks() {
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
                    window.redirectTo(href);
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
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleExternalLinks);
    } else {
        handleExternalLinks();
    }
    
    // Re-run when new content is added (for dynamic content)
    const observer = new MutationObserver(function(mutations) {
        let shouldRerun = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'A' || node.querySelector('a')) {
                            shouldRerun = true;
                            break;
                        }
                    }
                }
            }
        });
        
        if (shouldRerun) {
            setTimeout(handleExternalLinks, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();