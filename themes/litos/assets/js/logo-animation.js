// Logo Animation - 参考mizar-main实现
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否有logo元素
    const logoSection = document.querySelector('.logo-section');
    const logoPathMasks = document.querySelectorAll('.logo-path-mask');
    
    if (!logoPathMasks.length || !logoSection) {
        return;
    }

    // 初始化动画状态
    let isScrollAnimating = false;
    let scrollThreshold = 50;

    // 创建滚动动画
    function createScrollAnimation() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > scrollThreshold && !isScrollAnimating) {
            // 向下滚动，隐藏logo路径
            isScrollAnimating = true;
            logoSection.classList.add('logo-scrolled');
        } else if (currentScrollY <= scrollThreshold && isScrollAnimating) {
            // 向上滚动，显示logo路径
            isScrollAnimating = false;
            logoSection.classList.remove('logo-scrolled');
        }
    }

    // 路径绘制动画（页面加载时）
    function createDrawAnimation() {
        // 检查用户是否偏好减少动画
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        logoSection.classList.add('logo-loading');
        
        logoPathMasks.forEach((path, index) => {
            try {
                // 获取路径长度
                const pathLength = path.getTotalLength();
                
                // 设置初始状态
                path.style.strokeDasharray = pathLength;
                path.style.strokeDashoffset = pathLength;
                path.style.opacity = '1';
                
                // 延迟执行动画
                setTimeout(() => {
                    path.style.transition = `stroke-dashoffset 1.5s ease-out`;
                    path.style.strokeDashoffset = '0';
                    
                    // 动画完成后清理样式
                    setTimeout(() => {
                        path.style.strokeDasharray = '';
                        path.style.strokeDashoffset = '';
                        if (index === logoPathMasks.length - 1) {
                            logoSection.classList.remove('logo-loading');
                        }
                    }, 1500);
                }, 500 + (index * 300)); // 页面加载后500ms开始，每个路径延迟300ms
            } catch (e) {
                // 如果getTotalLength()失败，直接显示logo
                logoSection.classList.remove('logo-loading');
            }
        });
    }

    // 脉冲动画（可选，用于吸引注意力）
    function createPulseAnimation() {
        if (!logoSection || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        setInterval(() => {
            if (isScrollAnimating) return;
            
            logoSection.classList.add('logo-pulse');
            
            setTimeout(() => {
                logoSection.classList.remove('logo-pulse');
            }, 800);
        }, 10000); // 每10秒执行一次脉冲
    }

    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // 初始化所有动画
    function initAnimations() {
        // 页面加载动画
        createDrawAnimation();
        
        // 滚动动画
        const throttledScrollAnimation = throttle(createScrollAnimation, 16); // 60fps
        window.addEventListener('scroll', throttledScrollAnimation, { passive: true });
        
        // 脉冲动画（可选）
        createPulseAnimation();
    }

    // 启动动画
    initAnimations();

    // 响应式处理
    function handleResize() {
        // 在小屏幕上可能需要调整动画参数
        if (window.innerWidth < 768) {
            scrollThreshold = 30;
        } else {
            scrollThreshold = 50;
        }
    }

    window.addEventListener('resize', throttle(handleResize, 250));
    handleResize(); // 初始化时执行一次
});