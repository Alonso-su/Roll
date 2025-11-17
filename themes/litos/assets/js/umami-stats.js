/**
 * Umami统计展板功能
 * 支持快捷键呼出和移动端双击显示
 */

class UmamiStatsPanel {
    constructor() {
        this.isVisible = false;
        this.panel = null;
        this.config = null;
        this.touchCount = 0;
        this.touchTimer = null;
        
        this.init();
    }

    init() {
        // 从Hugo配置中获取umami配置
        this.loadConfig();
        
        // 创建统计面板
        this.createPanel();
        
        // 绑定事件
        this.bindEvents();
    }

    loadConfig() {
        // 从页面中获取umami配置（需要在模板中输出）
        const configElement = document.getElementById('umami-config');
        if (configElement) {
            try {
                this.config = JSON.parse(configElement.textContent);
            } catch (e) {
                // Silent fail
            }
        }
        
        // 默认配置
        if (!this.config) {
            this.config = {
                apiUrl: 'https://up.suuus.top/',
                websiteId: '7ebabcf6-c77f-4455-8ae5-2c1868e870f2',
                enable: true
            };
        }
        
        // 确保API URL以斜杠结尾
        if (this.config.apiUrl && !this.config.apiUrl.endsWith('/')) {
            this.config.apiUrl += '/';
        }
    }

    createPanel() {
        // 创建面板容器
        this.panel = document.createElement('div');
        this.panel.className = 'umami-stats-panel';
        this.panel.innerHTML = `
            <div class="umami-stats-overlay"></div>
            <div class="umami-stats-modal">
                <div class="umami-stats-header">
                    <h3>数据统计</h3>
                    <button class="umami-stats-close">&times;</button>
                </div>
                <div class="umami-stats-body">
                    <div class="stats-container">
                        <div class="stats-section">
                            <div class="stats-grid" id="blog-stats">
                                <div class="stats-item">
                                    <span class="stats-label">文章数</span>
                                    <span class="stats-value" id="total-posts">-</span>
                                </div>
                                <div class="stats-item">
                                    <span class="stats-label">总字数</span>
                                    <span class="stats-value" id="total-words">-</span>
                                </div>
                                <div class="stats-item">
                                    <span class="stats-label">平均字数</span>
                                    <span class="stats-value" id="avg-words">-</span>
                                </div>
                                <div class="stats-item">
                                    <span class="stats-label">运行天数</span>
                                    <span class="stats-value" id="running-days">-</span>
                                </div>
                            </div>
                        </div>
                        <div class="stats-section">
                            <div class="stats-grid" id="umami-stats">
                                <div class="loading">加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(this.panel);



        // 绑定关闭按钮事件
        const closeBtn = this.panel.querySelector('.umami-stats-close');
        closeBtn.addEventListener('click', () => this.hidePanel());

        // 点击遮罩层关闭
        const overlay = this.panel.querySelector('.umami-stats-overlay');
        overlay.addEventListener('click', () => this.hidePanel());
    }

    bindEvents() {
        // 快捷键事件 (Ctrl/Cmd + Q)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
                e.preventDefault();
                this.togglePanel();
            }
        });

        // 移动端双击事件
        document.addEventListener('touchend', (e) => {
            this.touchCount++;
            
            if (this.touchCount === 1) {
                this.touchTimer = setTimeout(() => {
                    this.touchCount = 0;
                }, 300);
            } else if (this.touchCount === 2) {
                clearTimeout(this.touchTimer);
                this.touchCount = 0;
                
                // 只在about页面响应双击
                if (window.location.pathname.includes('/about')) {
                    this.togglePanel();
                }
            }
        });

        // ESC键关闭面板
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePanel();
            }
        });
    }

    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        if (!this.config.enable) return;
        
        this.isVisible = true;
        this.panel.classList.add('visible');
        document.body.classList.add('umami-stats-open');
        
        // 加载统计数据
        this.loadStats();
    }

    hidePanel() {
        this.isVisible = false;
        this.panel.classList.remove('visible');
        document.body.classList.remove('umami-stats-open');
    }

    async loadStats() {
        // 加载博客统计数据
        this.loadBlogStats();
        
        // 加载umami统计数据
        this.loadUmamiStats();
    }

    loadBlogStats() {
        const blogStats = this.calculateBlogStats();
        
        // 更新博客统计数据
        const blogStatsMapping = {
            'total-posts': blogStats.totalPosts,
            'total-words': blogStats.totalWords,
            'avg-words': blogStats.avgWords,
            'running-days': blogStats.runningDays
        };

        Object.entries(blogStatsMapping).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(element, 0, value, 800);
            }
        });
    }

    async loadUmamiStats() {
        const umamiStatsEl = document.getElementById('umami-stats');
        if (!umamiStatsEl) return;

        umamiStatsEl.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            const data = await this.fetchStats('all');
            
            // 定义字段映射 - 支持多种可能的字段名称
            const fieldMapping = [
                { keys: ["today_uv", "todayUv", "today_visitors"], label: "今日人数" },
                { keys: ["today_pv", "todayPv", "today_pageviews"], label: "今日访问" },
                { keys: ["yesterday_uv", "yesterdayUv", "yesterday_visitors"], label: "昨日人数" },
                { keys: ["yesterday_pv", "yesterdayPv", "yesterday_pageviews"], label: "昨日访问" },
                { keys: ["last_month_pv", "lastMonthPv", "month_pageviews", "monthPv"], label: "本月访问" },
                { keys: ["last_year_pv", "lastYearPv", "year_pageviews", "yearPv"], label: "本年访问" }
            ];
            
            umamiStatsEl.innerHTML = '';
            
            fieldMapping.forEach(field => {
                // 尝试所有可能的字段名称
                let value = 0;
                
                for (const key of field.keys) {
                    if (data.hasOwnProperty(key)) {
                        value = data[key] || 0;
                        break;
                    }
                }
                
                umamiStatsEl.innerHTML += `
                    <div class="stats-item" title="${field.label}">
                        <span class="stats-label">${field.label}</span>
                        <span class="stats-value" data-value="${value}">0</span>
                    </div>`;
            });
            
            // 重新初始化动画
            umamiStatsEl.querySelectorAll('.stats-value').forEach(element => {
                const value = parseInt(element.getAttribute('data-value'));
                if (!isNaN(value)) {
                    this.animateValue(element, 0, value, 800);
                }
            });
            
        } catch (error) {
            umamiStatsEl.innerHTML = '<div class="error">数据加载失败</div>';
        }
    }

    async fetchStats(period) {
        // 使用配置中的API URL直接获取统计数据
        let apiUrl = this.config.apiUrl;
        
        // 确保 API URL 格式正确
        if (!apiUrl.startsWith('http')) {
            apiUrl = 'https://' + apiUrl;
        }
        
        // 移除末尾的斜杠（如果有）
        apiUrl = apiUrl.replace(/\/$/, '');
        
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // 检查返回的数据结构
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format received from API');
            }
            
            // 直接返回完整的API响应数据
            return data;
            
        } catch (error) {
            throw error;
        }
    }



    // 计算博客统计数据
    calculateBlogStats() {
        // 从Hugo配置中获取博客统计数据
        const configElement = document.getElementById('blog-stats');
        let blogStats = {
            totalPosts: 0,
            totalWords: 0,
            runningDays: 0,
            avgWords: 0
        };

        if (configElement) {
            try {
                blogStats = JSON.parse(configElement.textContent);
            } catch (e) {
                // Silent fail
            }
        } else {
            // 如果没有配置数据，尝试从页面元素获取
            const postsElements = document.querySelectorAll('[data-post-count]');
            if (postsElements.length > 0) {
                blogStats.totalPosts = parseInt(postsElements[0].getAttribute('data-post-count')) || 0;
            }

            // 计算运行天数（从2022年8月20日开始）
            const startDate = new Date('2022-08-20');
            const currentDate = new Date();
            blogStats.runningDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        }

        return blogStats;
    }

    // 添加数字动画效果
    animateValue(element, start, end, duration) {
        if (!element || isNaN(end)) return;
        if (end === 0) {
            element.textContent = '0';
            return;
        }
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = this.formatNumber(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }



    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// 初始化统计面板
document.addEventListener('DOMContentLoaded', () => {
    // 只在about页面或需要统计的页面初始化
    if (window.location.pathname.includes('/about') || document.body.classList.contains('enable-umami-stats')) {
        new UmamiStatsPanel();
    }
});