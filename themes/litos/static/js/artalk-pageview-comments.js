/**
 * Artalk 页面访问统计 - 基于评论数据的替代方案
 * 如果 PV API 不可用，使用评论数据作为活跃度指标
 */

(function() {
    'use strict';
    
    console.log('=== Artalk PageView (Comments-based) 开始加载 ===');
    
    const server = 'https://at.suuus.top';
    const site = '蘇SU';
    const pageKey = window.location.pathname;
    
    console.log('配置信息:', { server, site, pageKey });
    
    const pvElement = document.querySelector('.page-view-count');
    const pvLabel = document.querySelector('.page-view-label');
    
    if (!pvElement) {
        console.error('未找到 .page-view-count 元素！');
        return;
    }
    
    // 方案1: 尝试使用 Artalk 的统计 API
    async function tryStatAPI() {
        try {
            // 尝试获取页面统计信息
            const url = `${server}/api/v2/pages/get`;
            const payload = {
                site_name: site,
                key: pageKey
            };
            
            console.log('尝试获取页面信息:', url, payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            console.log('页面信息响应状态:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('页面信息返回:', JSON.stringify(data, null, 2));
                
                // 检查是否有 PV 数据
                if (data.data && data.data.pv) {
                    console.log('找到 PV 数据:', data.data.pv);
                    pvElement.textContent = data.data.pv;
                    pvElement.classList.add('loaded');
                    return true;
                }
            }
        } catch (error) {
            console.error('获取页面信息失败:', error);
        }
        return false;
    }
    
    // 方案2: 使用评论数作为活跃度指标
    async function useCommentCount() {
        try {
            const url = `${server}/api/v2/comments/list`;
            const payload = {
                site_name: site,
                page_key: pageKey,
                limit: 1,
                offset: 0
            };
            
            console.log('获取评论数:', url, payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            console.log('评论列表响应状态:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('评论数据返回:', JSON.stringify(data, null, 2));
                
                // 获取评论总数
                const commentCount = data.data?.total || data.total || 0;
                console.log('评论总数:', commentCount);
                
                if (commentCount > 0) {
                    // 使用评论数 * 10 作为估算的浏览量
                    const estimatedPV = commentCount * 10;
                    pvElement.textContent = estimatedPV;
                    pvElement.classList.add('loaded');
                    
                    // 修改标签文字
                    if (pvLabel) {
                        pvLabel.textContent = '条评论';
                        pvElement.textContent = commentCount;
                    }
                    return true;
                }
            }
        } catch (error) {
            console.error('获取评论数失败:', error);
        }
        return false;
    }
    
    // 方案3: 使用本地存储模拟浏览量
    function useLocalStorage() {
        const storageKey = `pv_${pageKey}`;
        let pv = parseInt(localStorage.getItem(storageKey) || '0');
        pv++;
        localStorage.setItem(storageKey, pv.toString());
        
        console.log('使用本地存储的浏览量:', pv);
        pvElement.textContent = pv;
        pvElement.classList.add('loaded');
        
        if (pvLabel) {
            pvLabel.textContent = '次访问 (本地)';
        }
    }
    
    // 依次尝试各种方案
    async function init() {
        console.log('开始初始化...');
        
        // 先尝试统计 API
        const statSuccess = await tryStatAPI();
        if (statSuccess) {
            console.log('✓ 使用统计 API');
            return;
        }
        
        // 再尝试评论数
        const commentSuccess = await useCommentCount();
        if (commentSuccess) {
            console.log('✓ 使用评论数');
            return;
        }
        
        // 最后使用本地存储
        console.log('✓ 使用本地存储');
        useLocalStorage();
    }
    
    // 延迟执行
    setTimeout(init, 1000);
    
    console.log('=== Artalk PageView 加载完成 ===');
})();
