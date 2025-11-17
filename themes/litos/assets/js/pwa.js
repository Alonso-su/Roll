// PWA 功能管理
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.swRegistration = null;
        
        this.init();
    }
    
    async init() {
        // 检查PWA支持
        if (!this.isPWASupported()) {
            return;
        }
        
        // 检查是否已安装
        this.checkInstallStatus();
        
        // 验证manifest
        await this.validateManifest();
        
        // 注册 Service Worker
        await this.registerServiceWorker();
        
        // 监听安装提示事件
        this.setupInstallPrompt();
        
        // 监听应用安装事件
        this.setupInstallEvents();
        
        // 监听更新事件
        this.setupUpdateEvents();
        

    }
    
    isPWASupported() {
        return 'serviceWorker' in navigator;
    }
    
    async validateManifest() {
        try {
            const response = await fetch('/manifest.json');
            if (response.ok) {
                const manifest = await response.json();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }
    
    checkInstallStatus() {
        // 检查是否在独立模式下运行（已安装）
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
        
        if (this.isInstalled) {
            document.body.classList.add('pwa-installed');
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                // 监听 Service Worker 状态变化
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                // Service Worker registration failed
            }
        }
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }
    
    setupInstallEvents() {
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
        });
    }
    

    

    

    

    

    
    setupUpdateEvents() {
        // 监听 Service Worker 更新
        if (this.swRegistration) {
            this.swRegistration.addEventListener('updatefound', () => {
                // New version available
            });
        }
    }
    
    showUpdateNotification() {
        // 显示更新通知
        const updateHTML = `
            <div id="pwa-update-prompt" class="pwa-update-prompt">
                <div class="pwa-update-content">
                    <span>A new version is available!</span>
                    <button id="pwa-update-btn" class="pwa-update-btn">Update</button>
                    <button id="pwa-update-dismiss" class="pwa-update-dismiss">×</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', updateHTML);
        
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            this.updateApp();
        });
        
        document.getElementById('pwa-update-dismiss').addEventListener('click', () => {
            document.getElementById('pwa-update-prompt').remove();
        });
    }
    
    updateApp() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
    
    // 获取安装状态
    getInstallStatus() {
        return {
            isInstalled: this.isInstalled,
            hasServiceWorker: !!this.swRegistration
        };
    }
}

// 初始化 PWA 管理器
let pwaManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaManager = new PWAManager();
    });
} else {
    pwaManager = new PWAManager();
}

// 导出到全局作用域
window.pwaManager = pwaManager;