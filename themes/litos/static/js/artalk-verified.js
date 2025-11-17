/**
 * Artalk 邮箱认证徽章功能
 * 基于Blog-main项目的实现
 */

(function() {
    'use strict';
    
    // 认证邮箱列表（可以从服务器获取或本地配置）
    const VERIFIED_EMAILS = [
        'hello@suus.me',
        'admin@example.com',
        'seer@example.com'
        // 可以添加更多认证邮箱
    ];
    
    // 检查邮箱是否已认证
    function isEmailVerified(email) {
        if (!email) return false;
        return VERIFIED_EMAILS.includes(email.toLowerCase().trim());
    }
    
    // 创建认证徽章
    function createVerifiedBadge() {
        const badge = document.createElement('span');
        badge.className = 'atk-verified-badge';
        badge.innerHTML = '<span class="atk-verified-icon"></span>';
        badge.title = '该用户邮箱已通过认证';
        return badge;
    }
    
    // 为评论添加认证徽章
    function addVerifiedBadgeToComment(commentElement, email) {
        if (!isEmailVerified(email)) {
            return;
        }
        
        const header = commentElement.querySelector('.atk-header');
        
        if (!header) {
            return;
        }
        
        // 检查是否已经有徽章
        if (header.querySelector('.atk-verified-badge')) {
            return;
        }
        
        const nickElement = header.querySelector('.atk-nick');
        
        if (nickElement) {
            const badge = createVerifiedBadge();
            // 在昵称后面添加徽章
            nickElement.parentNode.insertBefore(badge, nickElement.nextSibling);
        } else {
            // 如果没找到昵称元素，尝试添加到头部末尾
            const badge = createVerifiedBadge();
            header.appendChild(badge);
        }
    }
    
    // 监听评论区域变化
    function watchComments() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 立即处理新添加的评论
                            const comments = node.querySelectorAll ? 
                                node.querySelectorAll('.atk-comment') : [];
                            
                            comments.forEach(function(comment) {
                                // 立即处理，不延迟
                                setTimeout(() => processComment(comment), 50);
                            });
                            
                            // 如果节点本身就是评论
                            if (node.classList && node.classList.contains('atk-comment')) {
                                setTimeout(() => processComment(node), 50);
                            }
                        }
                    });
                }
            });
        });
        
        // 观察评论容器
        const container = document.querySelector('#artalk-container');
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true
            });
        }
        
        // 更频繁地检查已存在的评论
        const checkExistingComments = () => {
            const existingComments = document.querySelectorAll('.atk-comment');
            if (existingComments.length > 0) {
                existingComments.forEach(processComment);
            } else {
                setTimeout(checkExistingComments, 500);
            }
        };
        
        // 立即开始检查，然后定期检查
        checkExistingComments();
        setTimeout(checkExistingComments, 1000);
        setTimeout(checkExistingComments, 3000);
    }
    
    // 处理单个评论
    function processComment(commentElement) {
        // 尝试从评论数据中获取邮箱信息
        // 方法1: 从data属性获取
        const email = commentElement.dataset.email;
        if (email) {
            addVerifiedBadgeToComment(commentElement, email);
            return;
        }
        
        // 方法2: 从评论内容中推断（如果有显示邮箱）
        const emailElements = commentElement.querySelectorAll('[data-email], .atk-email');
        emailElements.forEach(function(element) {
            const emailValue = element.dataset.email || element.textContent;
            if (emailValue) {
                addVerifiedBadgeToComment(commentElement, emailValue);
            }
        });
        
        // 方法3: 检查是否是当前用户的评论
        const currentUserEmail = getCurrentUserEmail();
        
        if (currentUserEmail && isEmailVerified(currentUserEmail)) {
            // 为当前用户的评论添加徽章（假设所有评论都可能是当前用户的）
            addVerifiedBadgeToComment(commentElement, currentUserEmail);
        }
        
        // 方法4: 检查预设的认证邮箱
        VERIFIED_EMAILS.forEach(function(verifiedEmail) {
            // 简单的文本匹配（在实际应用中应该有更好的方法）
            if (commentElement.textContent.includes(verifiedEmail)) {
                addVerifiedBadgeToComment(commentElement, verifiedEmail);
            }
        });
    }
    
    // 获取当前用户邮箱
    function getCurrentUserEmail() {
        // 从localStorage获取缓存的邮箱
        if (window.ArtalkAvatar && window.ArtalkAvatar.cache) {
            return window.ArtalkAvatar.cache.get();
        }
        
        // 从输入框获取
        const emailInput = document.querySelector('input[name="email"]');
        return emailInput ? emailInput.value : null;
    }
    
    // 手动为指定邮箱添加认证
    function addVerifiedEmail(email) {
        if (email && !VERIFIED_EMAILS.includes(email.toLowerCase().trim())) {
            VERIFIED_EMAILS.push(email.toLowerCase().trim());
            
            // 重新处理所有评论
            const comments = document.querySelectorAll('.atk-comment');
            comments.forEach(processComment);
        }
    }
    
    // 移除邮箱认证
    function removeVerifiedEmail(email) {
        const index = VERIFIED_EMAILS.indexOf(email.toLowerCase().trim());
        if (index > -1) {
            VERIFIED_EMAILS.splice(index, 1);
            
            // 移除相关徽章
            const badges = document.querySelectorAll('.atk-verified-badge');
            badges.forEach(badge => badge.remove());
            
            // 重新处理所有评论
            setTimeout(() => {
                const comments = document.querySelectorAll('.atk-comment');
                comments.forEach(processComment);
            }, 100);
        }
    }
    
    // 初始化
    function init() {
        watchComments();
        
        // 导出到全局
        window.ArtalkVerified = {
            addVerifiedEmail: addVerifiedEmail,
            removeVerifiedEmail: removeVerifiedEmail,
            isEmailVerified: isEmailVerified,
            getVerifiedEmails: () => [...VERIFIED_EMAILS],
            processComment: processComment,
            createVerifiedBadge: createVerifiedBadge,
            testBadge: function() {
                const comments = document.querySelectorAll('.atk-comment');
                comments.forEach((comment, index) => {
                    processComment(comment);
                });
                
                // 如果没有评论，创建一个测试徽章
                if (comments.length === 0) {
                    const container = document.querySelector('#artalk-container');
                    if (container) {
                        const testBadge = createVerifiedBadge();
                        testBadge.style.margin = '10px';
                        container.appendChild(testBadge);
                    }
                }
            }
        };
    }
    
    // 更早的初始化时机
    function earlyInit() {
        // 立即尝试初始化
        init();
        
        // 也在DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        }
        
        // 监听Artalk实例创建
        if (window.artalkInstance) {
            init();
        } else {
            // 监听全局Artalk实例
            const checkArtalk = () => {
                if (window.artalkInstance || window.Artalk) {
                    init();
                } else {
                    setTimeout(checkArtalk, 100);
                }
            };
            checkArtalk();
        }
    }
    
    // 立即开始初始化
    earlyInit();
    
})();