/**
 * Artalk 页面访问统计功能
 * 利用 Artalk API 获取和显示页面浏览量
 */

(function() {
    'use strict';
    
    // 配置
    const config = {
        server: document.querySelector('meta[name="artalk-server"]')?.content || '',
        site: document.querySelector('meta[name="artalk-site"]')?.content || '',
        pageKey: window.location.pathname,
        updateInterval: 60000 // 更新间隔（毫秒）
    };
    
    console.log('Artalk PageView 配置:', config);
    
    // 获取页面浏览量 - 使用 GET 方法
    async function getPageView() {
        if (!config.server || !config.site) {
            console.warn('Artalk 配置不完整，无法获取浏览量', {
                server: config.server,
                site: config.site
            });
            return null;
        }
        
        try {
            // 尝试使用 GET 方法获取统计数据
            const params = new URLSearchParams({
                site_name: config.site,
                page_key: config.pageKey
            });
            
            const url = `${config.server}/api/v2/stats/page_pv?${params}`;
            console.log('请求浏览量 API (GET):', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('API 响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 错误响应:', errorText);
                
                // 如果 GET 失败，尝试 POST
                return await getPageViewPost();
            }
            
            const data = await response.json();
            console.log('API 返回数据:', data);
            
            const pv = data.data?.pv || data.pv || 0;
            console.log('解析的浏览量:', pv);
            
            return pv;
        } catch (error) {
            console.error('获取页面浏览量失败:', error);
            // 尝试 POST 方法
            return await getPageViewPost();
        }
    }
    
    // 使用 POST 方法获取浏览量
    async function getPageViewPost() {
        try {
            const url = `${config.server}/api/v2/stats/page_pv`;
            const payload = {
                site_name: config.site,
                page_key: config.pageKey
            };
            
            console.log('请求浏览量 API (POST):', url, payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('POST API 错误响应:', errorText);
                return null;
            }
            
            const data = await response.json();
            console.log('POST API 返回数据:', data);
            
            return data.data?.pv || data.pv || 0;
        } catch (error) {
            console.error('POST 方法获取浏览量失败:', error);
            return null;
        }
    }
    
    // 更新页面浏览量显示
    function updatePageViewDisplay(pv) {
        const pvElements = document.querySelectorAll('.page-view-count');
        
        pvElements.forEach(element => {
            if (pv !== null) {
                element.textContent = formatNumber(pv);
                element.classList.add('loaded');
            } else {
                element.textContent = '--';
            }
        });
    }
    
    // 格式化数字（添加千位分隔符）
    function formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // 增加页面浏览量（访问统计）
    async function incrementPageView() {
        if (!config.server || !config.site) {
            console.warn('无法增加浏览量：配置不完整');
            return;
        }
        
        try {
            const url = `${config.server}/api/v2/stats/page_pv`;
            const payload = {
                site_name: config.site,
                page_key: config.pageKey
            };
            
            console.log('增加浏览量:', url, payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('增加浏览量失败:', response.status, errorText);
            } else {
                console.log('浏览量增加成功');
            }
        } catch (error) {
            console.error('增加页面浏览量失败:', error);
        }
    }
    
    // 初始化
    async function init() {
        console.log('初始化 Artalk PageView...');
        
        // 检查元素是否存在
        const pvElements = document.querySelectorAll('.page-view-count');
        console.log('找到浏览量显示元素:', pvElements.length);
        
        if (pvElements.length === 0) {
            console.warn('未找到 .page-view-count 元素');
            return;
        }
        
        // 增加访问计数
        await incrementPageView();
        
        // 获取并显示浏览量
        const pv = await getPageView();
        console.log('获取到的浏览量:', pv);
        updatePageViewDisplay(pv);
        
        // 定期更新浏览量
        setInterval(async () => {
            const pv = await getPageView();
            updatePageViewDisplay(pv);
        }, config.updateInterval);
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 导出到全局
    window.ArtalkPageView = {
        getPageView,
        updatePageViewDisplay,
        incrementPageView
    };
})();
