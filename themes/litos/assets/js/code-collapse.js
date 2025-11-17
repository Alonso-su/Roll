// Code Block Collapse Functionality
document.addEventListener('DOMContentLoaded', function() {
    // 配置选项
    const CONFIG = {
        minLines: 15, // 超过多少行才显示折叠按钮
        collapsedLines: 8, // 折叠时显示的行数
        animationDuration: 300 // 动画持续时间(ms)
    };

    // 初始化代码块折叠功能
    function initCodeCollapse() {
        const codeBlocks = document.querySelectorAll('.highlight pre, pre:not(.highlight pre)');
        
        codeBlocks.forEach(pre => {
            processCodeBlock(pre);
        });
    }

    // 处理单个代码块
    function processCodeBlock(pre) {
        const code = pre.querySelector('code') || pre;
        const lines = code.textContent.split('\n');
        
        // 只对超过最小行数的代码块添加折叠功能
        if (lines.length <= CONFIG.minLines) {
            return;
        }

        // 创建包装器
        const wrapper = createCodeWrapper(pre);
        
        // 创建折叠按钮
        const collapseBtn = createCollapseButton();
        
        // 添加折叠功能
        setupCollapse(wrapper, pre, collapseBtn, lines);
    }

    // 创建代码块包装器
    function createCodeWrapper(pre) {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-collapsible';
        
        // 将pre元素包装起来
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        
        return wrapper;
    }

    // 创建折叠按钮
    function createCollapseButton() {
        const button = document.createElement('button');
        button.className = 'code-collapse-btn';
        button.innerHTML = `
            <span class="collapse-text">展开代码</span>
            <svg class="collapse-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        return button;
    }

    // 设置折叠功能
    function setupCollapse(wrapper, pre, button, lines) {
        let isCollapsed = true;
        const originalHeight = pre.scrollHeight;
        
        // 计算折叠高度
        const lineHeight = getLineHeight(pre);
        const collapsedHeight = lineHeight * CONFIG.collapsedLines;
        
        // 初始状态设为折叠
        pre.style.maxHeight = collapsedHeight + 'px';
        pre.style.overflow = 'hidden';
        pre.style.transition = `max-height ${CONFIG.animationDuration}ms ease-in-out`;
        
        // 添加渐变遮罩
        const fadeOverlay = createFadeOverlay();
        wrapper.appendChild(fadeOverlay);
        
        // 添加按钮
        wrapper.appendChild(button);
        
        // 按钮点击事件
        button.addEventListener('click', function() {
            if (isCollapsed) {
                // 展开
                pre.style.maxHeight = (originalHeight + 70) + 'px'; // 增加额外高度
                pre.style.paddingBottom = '70px'; // 添加底部内边距
                fadeOverlay.style.opacity = '0';
                button.querySelector('.collapse-text').textContent = '折叠代码';
                button.classList.add('expanded');
                wrapper.classList.add('expanded');
            } else {
                // 折叠
                pre.style.maxHeight = collapsedHeight + 'px';
                pre.style.paddingBottom = ''; // 移除底部内边距
                fadeOverlay.style.opacity = '1';
                button.querySelector('.collapse-text').textContent = '展开代码';
                button.classList.remove('expanded');
                wrapper.classList.remove('expanded');
            }
            
            isCollapsed = !isCollapsed;
        });
    }

    // 创建渐变遮罩
    function createFadeOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'code-fade-overlay';
        return overlay;
    }

    // 获取行高
    function getLineHeight(element) {
        const style = window.getComputedStyle(element);
        const lineHeight = parseFloat(style.lineHeight);
        const fontSize = parseFloat(style.fontSize);
        
        // 如果lineHeight是normal或者无效值，使用fontSize * 1.5作为默认值
        if (isNaN(lineHeight) || lineHeight < fontSize) {
            return fontSize * 1.5;
        }
        
        return lineHeight;
    }

    // 初始化
    initCodeCollapse();
});