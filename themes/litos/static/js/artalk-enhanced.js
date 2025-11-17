/**
 * Artalk 增强功能 - 折叠展开评论框
 * 整合版本 - 包含所有必要功能
 */

(function() {
    'use strict';
    

    
    let isInitialized = false;
    let editor = null;
    let textarea = null;
    let wrapper = null;
    let avatar = null;
    let emailInput = null;
    
    // 简化的MD5哈希函数
    function md5(str) {
        // 使用Web Crypto API（如果可用）
        if (window.crypto && window.crypto.subtle) {
            return crypto.subtle.digest('MD5', new TextEncoder().encode(str))
                .then(hash => Array.from(new Uint8Array(hash))
                    .map(b => b.toString(16).padStart(2, '0')).join(''))
                .catch(() => simpleMd5(str));
        }
        
        // 回退到简单实现
        return simpleMd5(str);
    }
    
    // 简单的MD5实现（用于测试）
    function simpleMd5(str) {
        // 这是一个简化版本，仅用于演示
        // 实际项目中应该使用完整的MD5库
        var hash = 0;
        if (str.length === 0) return hash.toString(16);
        
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 转换为16进制并补齐到32位
        var result = Math.abs(hash).toString(16);
        while (result.length < 32) {
            result = '0' + result;
        }
        
        return result;
    }
    
    // 头像功能已移至 artalk-avatar.js
    
    // 创建头像和包装器结构
    function createAvatarStructure() {
        // 检查是否已经创建过结构
        if (editor.closest('.comment-box-wrapper')) {
            wrapper = editor.closest('.comment-box-wrapper');
            avatar = wrapper.querySelector('.comment-avatar');
            return;
        }
        
        // 创建包装器
        wrapper = document.createElement('div');
        wrapper.className = 'comment-box-wrapper';
        
        // 创建头像容器
        avatar = document.createElement('div');
        avatar.className = 'comment-avatar';
        avatar.innerHTML = `
            <div class="avatar-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>
        `;
        
        // 创建表单包装器
        const formWrapper = document.createElement('div');
        formWrapper.className = 'comment-form-wrapper';
        
        // 重新组织DOM结构
        const parent = editor.parentNode;
        parent.insertBefore(wrapper, editor);
        
        wrapper.appendChild(avatar);
        wrapper.appendChild(formWrapper);
        formWrapper.appendChild(editor);
        

        
        // 查找邮箱输入框并设置监听
        setupEmailListener();
        
        // 设置通用输入监听器（备用方案）
        setupUniversalListener();
    }
    
    // 设置邮箱输入监听
    function setupEmailListener() {
        let attempts = 0;
        const maxAttempts = 20;
        
        // 等待邮箱输入框出现
        const checkEmailInput = () => {
            attempts++;

            
            // 尝试多种选择器
            emailInput = editor.querySelector('input[name="email"]') || 
                        editor.querySelector('input[type="email"]') ||
                        editor.querySelector('.atk-email') ||
                        document.querySelector('input[name="email"]') ||
                        document.querySelector('input[type="email"]');
            
            if (emailInput) {
                // 头像功能已移至 artalk-avatar.js
                
                return true;
            } else {

                
                if (attempts < maxAttempts) {
                    setTimeout(checkEmailInput, 500);
                } else {
                    console.warn('超过最大尝试次数，停止查找邮箱输入框');
                }
                return false;
            }
        };
        
        checkEmailInput();
    }
    
    // 设置通用输入监听器（备用方案）
    function setupUniversalListener() {
        // 监听整个编辑器区域的输入变化
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // 重新查找邮箱输入框
                    const newEmailInput = editor.querySelector('input[name="email"]') || 
                                         editor.querySelector('input[type="email"]');
                    
                    if (newEmailInput && newEmailInput !== emailInput) {

                        emailInput = newEmailInput;
                        setupEmailListener();
                    }
                }
            });
        });
        
        observer.observe(editor, {
            childList: true,
            subtree: true,
            attributes: true
        });
        
        // 邮箱监听已移至 artalk-avatar.js
        

    }
    
    // 头像功能已移至 artalk-avatar.js
    
    // 应用折叠功能
    function initializeCollapse() {
        if (isInitialized) return;
        
        // 查找编辑器元素
        editor = document.querySelector('.atk-main-editor');
        if (!editor) {

            setTimeout(initializeCollapse, 200);
            return;
        }
        
        // 查找文本框
        textarea = editor.querySelector('.atk-textarea');
        if (!textarea) {

            setTimeout(initializeCollapse, 200);
            return;
        }
        

        
        // 创建头像和包装器结构
        createAvatarStructure();
        
        // 设置初始折叠状态
        if (wrapper) {
            wrapper.classList.add('collapsed');
        }
        
        // 绑定事件
        bindEvents();
        
        isInitialized = true;

        
        // 导出控制函数到全局
        window.ArtalkCollapse = {
            expand: expandCommentBox,
            collapse: collapseCommentBox,
            toggle: toggleCommentBox,
            reset: resetToCollapsed,
            isCollapsed: () => wrapper && wrapper.classList.contains('collapsed')
        };
    }
    
    // 绑定所有事件
    function bindEvents() {
        // 点击文本框展开
        textarea.addEventListener('click', handleTextareaClick);
        
        // 焦点事件展开
        textarea.addEventListener('focus', handleTextareaFocus);
        
        // 键盘事件（保留ESC键功能）
        document.addEventListener('keydown', handleKeydown);
        

    }
    
    // 处理文本框点击
    function handleTextareaClick(e) {
        if (wrapper && wrapper.classList.contains('collapsed')) {
            e.preventDefault();
            expandCommentBox();
        }
    }
    
    // 处理文本框焦点
    function handleTextareaFocus() {
        if (wrapper && wrapper.classList.contains('collapsed')) {
            expandCommentBox();
        }
    }
    
    // 处理文档点击（已移除自动收缩功能）
    // function handleDocumentClick(e) {
    //     if (!editor.contains(e.target) && 
    //         !editor.classList.contains('collapsed') &&
    //         textarea.value.trim() === '') {
    //         collapseCommentBox();
    //     }
    // }
    
    // 处理键盘事件
    function handleKeydown(e) {
        // ESC 键收缩评论框（仅在内容为空时）
        if (e.key === 'Escape' && 
            wrapper && !wrapper.classList.contains('collapsed') &&
            textarea.value.trim() === '') {
            collapseCommentBox();
        }
    }
    
    // 展开评论框
    function expandCommentBox() {
        if (!wrapper || !wrapper.classList.contains('collapsed')) return;
        

        wrapper.classList.remove('collapsed');
        
        // 延迟聚焦，确保动画完成
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    }
    
    // 收缩评论框
    function collapseCommentBox() {
        if (!wrapper || wrapper.classList.contains('collapsed')) return;
        

        wrapper.classList.add('collapsed');
        
        // 清空内容并失去焦点
        if (textarea) {
            textarea.value = '';
            textarea.blur();
        }
    }
    
    // 切换评论框状态
    function toggleCommentBox() {
        if (wrapper && wrapper.classList.contains('collapsed')) {
            expandCommentBox();
        } else {
            collapseCommentBox();
        }
    }
    
    // 重置评论框到折叠状态
    function resetToCollapsed() {
        if (wrapper && !wrapper.classList.contains('collapsed')) {

            wrapper.classList.add('collapsed');
            if (textarea) {
                textarea.value = '';
                textarea.blur();
            }
        }
    }
    
    // 初始化函数
    function initialize() {
        // 立即尝试初始化
        initializeCollapse();
        
        // 如果页面还在加载，等待加载完成后再试
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(initializeCollapse, 500);
            });
        }
        
        // 监听页面刷新/重新加载
        window.addEventListener('beforeunload', resetToCollapsed);
        
        // 监听页面可见性变化（切换标签页等）
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // 页面重新可见时重置为折叠状态
                setTimeout(resetToCollapsed, 100);
            }
        });
        
        // 监听 Artalk 相关的变化
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && !isInitialized) {
                    initializeCollapse();
                }
            });
        });
        
        // 观察整个文档的变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // 10秒后停止观察
        setTimeout(() => {
            observer.disconnect();
        }, 10000);
    }
    
    // 启动初始化
    initialize();
    

    
})();