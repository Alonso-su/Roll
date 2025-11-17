// Litos Theme JavaScript
// Minimal JavaScript for enhanced functionality

(function() {
    'use strict';

    // Theme switching functionality
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.querySelector('.theme-icon-sun');
        const moonIcon = document.querySelector('.theme-icon-moon');
        
        if (!themeToggle || !sunIcon || !moonIcon) return;
        
        function updateThemeIcon() {
            const isDark = document.documentElement.classList.contains('dark');
            sunIcon.style.display = isDark ? 'none' : 'block';
            moonIcon.style.display = isDark ? 'block' : 'none';
        }
        
        // Initial icon state
        updateThemeIcon();
        
        // Toggle theme on click
        themeToggle.addEventListener('click', function() {
            const isDark = document.documentElement.classList.contains('dark');
            const newTheme = !isDark ? 'dark' : 'light';
            
            document.documentElement.classList.toggle('dark', !isDark);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon();
        });
    }

    // Smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Enhanced keyboard navigation
    function initKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // Toggle theme with Ctrl/Cmd + D
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                const themeToggle = document.getElementById('theme-toggle');
                if (themeToggle) {
                    themeToggle.click();
                }
            }
        });
    }

    // Add loading states for better UX
    function initLoadingStates() {
        // Add loading class to body initially
        document.body.classList.add('loading');
        
        // Remove loading class when page is fully loaded
        window.addEventListener('load', function() {
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
            document.documentElement.classList.add('loaded');
        });
    }

    // Code block copy functionality
    function initCodeCopy() {
        // Add copy buttons to all code blocks
        document.querySelectorAll('pre').forEach((pre, index) => {
            // Skip if already has copy button
            if (pre.querySelector('.code-copy-btn')) return;
            
            // Create wrapper if not exists
            if (!pre.parentElement.classList.contains('code-block-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
            }
            
            const wrapper = pre.parentElement;
            
            // Get language from class name
            const codeElement = pre.querySelector('code');
            let language = 'text';
            if (codeElement && codeElement.className) {
                const match = codeElement.className.match(/language-(\w+)/);
                if (match) {
                    language = match[1];
                }
            }
            
            // Create header with language and copy button
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `
                <span class="code-language">${language}</span>
                <button class="code-copy-btn" data-code-index="${index}" title="Copy code">
                    <i class="ri-file-copy-line copy-icon"></i>
                    <i class="ri-check-line check-icon" style="display: none;"></i>
                </button>
            `;
            
            wrapper.insertBefore(header, pre);
            
            // Add copy functionality
            const copyBtn = header.querySelector('.code-copy-btn');
            const copyIcon = header.querySelector('.copy-icon');
            const checkIcon = header.querySelector('.check-icon');
            
            copyBtn.addEventListener('click', async function() {
                const code = pre.textContent || '';
                
                try {
                    await navigator.clipboard.writeText(code);
                    
                    // Show success state
                    copyIcon.style.display = 'none';
                    checkIcon.style.display = 'block';
                    copyBtn.style.color = 'var(--color-primary)';
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        copyIcon.style.display = 'block';
                        checkIcon.style.display = 'none';
                        copyBtn.style.color = '';
                    }, 2000);
                } catch (err) {
                    // Copy failed silently
                }
            });
        });
    }

    // Back to top functionality - ITboy style
    function initBackToTop() {
        /**
         * 处理滚动事件，控制回到顶部按钮的显示/隐藏
         */
        function handleScroll() {
            // 获取所有以 backToTop 开头的按钮元素
            const backToTopButtons = document.querySelectorAll('[id^="backToTop"]');
            const footer = document.querySelector('footer');

            backToTopButtons.forEach((button) => {
                // 判断是否为移动端按钮
                const isMobile = button.id === 'backToTopMobile';
                // 基础显示条件：滚动超过 300px
                let shouldShow = window.scrollY > 300;

                // 移动端特殊处理：接近 footer 时隐藏按钮，避免重叠
                if (isMobile && footer && shouldShow) {
                    const footerTop = footer.getBoundingClientRect().top;
                    const windowHeight = window.innerHeight;
                    // 如果 footer 进入视口底部 100px 范围内，隐藏按钮
                    shouldShow = footerTop > windowHeight - 100;
                }

                if (isMobile) {
                    // 移动端：滑动隐藏到屏幕外
                    if (shouldShow) {
                        button.style.opacity = '1';
                        button.style.visibility = 'visible';
                        button.style.transform = 'translateY(0)';
                        button.style.pointerEvents = 'auto';
                    } else {
                        button.style.opacity = '0';
                        button.style.visibility = 'hidden';
                        // 滑动到屏幕外底部，完全避开交互区域
                        button.style.transform = 'translateY(120px)';
                        button.style.pointerEvents = 'none';
                    }
                } else {
                    // 桌面端：保持原有动画
                    if (shouldShow) {
                        button.style.opacity = '1';
                        button.style.visibility = 'visible';
                        button.style.transform = 'translateY(0)';
                    } else {
                        button.style.opacity = '0';
                        button.style.visibility = 'hidden';
                        button.style.transform = 'translateY(1rem)';
                    }
                }
            });
        }

        // 获取所有回到顶部按钮
        const backToTopButtons = document.querySelectorAll('[id^="backToTop"]');

        // 为每个按钮添加点击事件监听器
        backToTopButtons.forEach((button) => {
            button.addEventListener('click', () => {
                // 平滑滚动到页面顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // 监听页面滚动事件
        window.addEventListener('scroll', handleScroll);
        
        // 初始状态检查
        handleScroll();
    }

    // Initialize all functionality when DOM is ready
    function init() {
        initThemeToggle();
        initSmoothScroll();
        initKeyboardNavigation();
        initLoadingStates();
        initCodeCopy();
        initBackToTop();
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();