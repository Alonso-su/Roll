// Alert 提示框交互功能
document.addEventListener('DOMContentLoaded', function() {
    // 处理可关闭的提示框
    const closeButtons = document.querySelectorAll('.alert-close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发折叠功能
            const alert = this.closest('.alert');
            if (alert) {
                // 添加淡出动画
                alert.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                alert.style.opacity = '0';
                alert.style.transform = 'translateY(-10px)';
                
                // 动画完成后移除元素
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }
        });
    });
    
    // 处理可折叠的提示框
    const toggleButtons = document.querySelectorAll('.alert-toggle');
    const clickableHeaders = document.querySelectorAll('.alert-header-clickable');
    
    // 折叠/展开功能
    function toggleAlert(alert) {
        const content = alert.querySelector('.alert-content');
        const isCollapsed = alert.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展开
            // 先移除collapsed类以获取真实高度
            alert.classList.remove('collapsed');
            alert.querySelector('.alert-header').setAttribute('aria-expanded', 'true');
            
            // 临时设置为0，然后动画到真实高度
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            
            // 强制重绘
            content.offsetHeight;
            
            // 设置目标高度
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            
            // 动画完成后清理内联样式
            setTimeout(() => {
                content.style.maxHeight = '';
                content.style.opacity = '';
            }, 300);
        } else {
            // 折叠
            // 先设置当前高度
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            
            // 强制重绘
            content.offsetHeight;
            
            // 添加collapsed类并设置为0
            alert.classList.add('collapsed');
            alert.querySelector('.alert-header').setAttribute('aria-expanded', 'false');
            
            // 动画到0高度
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
        }
    }
    
    // 绑定折叠按钮事件
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const alert = this.closest('.alert');
            if (alert) {
                toggleAlert(alert);
            }
        });
    });
    
    // 绑定可点击标题事件
    clickableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const alert = this.closest('.alert');
            if (alert) {
                toggleAlert(alert);
            }
        });
        
        // 键盘支持
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const alert = this.closest('.alert');
                if (alert) {
                    toggleAlert(alert);
                }
            }
        });
    });
    
    // 键盘支持 - ESC键关闭最近的可关闭提示框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const closableAlerts = document.querySelectorAll('.alert .alert-close');
            if (closableAlerts.length > 0) {
                // 关闭最后一个可关闭的提示框
                const lastAlert = closableAlerts[closableAlerts.length - 1];
                lastAlert.click();
            }
        }
    });
});