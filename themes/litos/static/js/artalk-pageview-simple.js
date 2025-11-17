/**
 * Artalk 页面访问统计功能 - 简化测试版本
 */

(function() {
    'use strict';
    
    console.log('=== Artalk PageView 开始加载 ===');
    
    // 直接从配置获取
    const server = 'https://at.suuus.top';
    const site = '蘇SU';
    const pageKey = window.location.pathname;
    
    console.log('配置信息:', { server, site, pageKey });
    
    // 检查元素
    const pvElement = document.querySelector('.page-view-count');
    console.log('浏览量元素:', pvElement);
    
    if (!pvElement) {
        console.error('未找到 .page-view-count 元素！');
        return;
    }
    
    // 使用本地存储模拟浏览量（临时方案）
    function useLocalPV() {
        const storageKey = `artalk_pv_${pageKey}`;
        let pv = parseInt(localStorage.getItem(storageKey) || '0');
        
        // 每次访问增加1
        pv++;
        localStorage.setItem(storageKey, pv.toString());
        
        console.log('本地浏览量:', pv);
        pvElement.textContent = pv;
        pvElement.classList.add('loaded');
        
        return pv;
    }
    
    // 尝试从 Artalk 获取真实浏览量
    async function fetchRealPV() {
        try {
            // 尝试多个可能的 API 端点
            const endpoints = [
                {
                    method: 'GET',
                    url: `${server}/api/v2/stats/page_pv?site_name=${encodeURIComponent(site)}&page_key=${encodeURIComponent(pageKey)}`
                },
                {
                    method: 'POST',
                    url: `${server}/api/v2/stats/page_pv`,
                    body: { site_name: site, page_key: pageKey }
                },
                {
                    method: 'PUT',
                    url: `${server}/api/v2/stats/page_pv`,
                    body: { site_name: site, page_key: pageKey }
                },
                {
                    method: 'POST',
                    url: `${server}/api/v2/pages/get`,
                    body: { site_name: site, key: pageKey }
                }
            ];
            
            for (const endpoint of endpoints) {
                console.log(`尝试 ${endpoint.method} ${endpoint.url}`);
                
                const options = {
                    method: endpoint.method,
                    headers: { 'Content-Type': 'application/json' }
                };
                
                if (endpoint.body) {
                    options.body = JSON.stringify(endpoint.body);
                }
                
                try {
                    const response = await fetch(endpoint.url, options);
                    console.log(`${endpoint.method} 响应:`, response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`${endpoint.method} 数据:`, JSON.stringify(data, null, 2));
                        
                        // 尝试提取 PV
                        let pv = null;
                        if (data.data && typeof data.data.pv === 'number') {
                            pv = data.data.pv;
                        } else if (typeof data.pv === 'number') {
                            pv = data.pv;
                        } else if (data.data && typeof data.data.view_count === 'number') {
                            pv = data.data.view_count;
                        }
                        
                        if (pv !== null && pv > 0) {
                            console.log('✓ 找到真实浏览量:', pv);
                            pvElement.textContent = pv;
                            pvElement.classList.add('loaded');
                            return pv;
                        }
                    }
                } catch (err) {
                    console.log(`${endpoint.method} 失败:`, err.message);
                }
            }
            
            console.warn('所有 API 端点都未返回有效数据，使用本地存储');
            return null;
            
        } catch (error) {
            console.error('获取真实浏览量失败:', error);
            return null;
        }
    }
    
    // 主函数
    async function incrementAndFetchPV() {
        // 先显示本地浏览量
        const localPV = useLocalPV();
        
        // 然后尝试获取真实浏览量
        const realPV = await fetchRealPV();
        
        if (realPV === null) {
            console.log('使用本地浏览量:', localPV);
        }
    }
    
    // 延迟执行，确保 DOM 完全加载
    setTimeout(() => {
        console.log('开始增加并获取浏览量...');
        incrementAndFetchPV();
    }, 1000);
    
    console.log('=== Artalk PageView 加载完成 ===');
})();
