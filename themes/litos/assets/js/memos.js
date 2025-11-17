// 唠里唠叨 - Memos 组件
var hasLogin = 0; // 没登录隐藏编辑归档按钮

var memosData = {
    dom: '#memos',
}

var bbMemo = {
    memos: 'https://me.suuus.top/',
    limit: '8',
    creatorId: '1',
    domId: '#bber',
};

// 允许外部配置覆盖默认设置
if (typeof(bbMemos) !== "undefined") {
    for (var key in bbMemos) {
        if (bbMemos[key]) {
            bbMemo[key] = bbMemos[key];
        }
    }
}

var limit = bbMemo.limit;
var memos = bbMemo.memos;
var mePage = 1, offset = 0, nextLength = 0, nextDom = '';
var bbDom = null;
var load = '<div class="bb-load"><button class="load-btn button-load"><span class="corner"></span><span class="btn-content">加载中……</span></button></div>';

// memos编辑及归档相关变量
var memosOpenId = window.localStorage && window.localStorage.getItem("memos-access-token");
var memosPath = window.localStorage && window.localStorage.getItem("memos-access-path");
var getEditor = window.localStorage && window.localStorage.getItem("memos-editor-display");
var memoChangeDate = 0;
var getSelectedValue = window.localStorage && window.localStorage.getItem("memos-visibility-select") || "PUBLIC";

// 初始化函数
function initMemos() {
    bbDom = document.querySelector(bbMemo.domId);
    if (bbDom) {
        getFirstList(); // 首次加载数据
        meNums(); // 加载总数
        var btn = document.querySelector("button.button-load");
        if (btn) {
            btn.addEventListener("click", function () {
                var btnContent = btn.querySelector('.btn-content');
                if (btnContent) btnContent.textContent = '加载中……';
                updateHTMl(nextDom);
                if (nextLength < limit) { // 返回数据条数小于限制条数，隐藏
                    document.querySelector("button.button-load").remove();
                    return;
                }
                getNextList();
            });
        }
    }
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMemos);
} else {
    initMemos();
}

function getFirstList() {
    if (!bbDom) {
        return;
    }
    

    
    // 清空容器内容（包括骨架屏）
    bbDom.innerHTML = '';
    
    bbDom.insertAdjacentHTML('afterend', load);
    let tagHtml = `<div id="tag-list"></div>`; // TAG筛选
    bbDom.insertAdjacentHTML('beforebegin', tagHtml);
    
    var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&rowStatus=NORMAL&limit=" + limit;
    
    let memosOpenId = window.localStorage && window.localStorage.getItem("memos-access-token");
    
    if (memosOpenId && memosOpenId != null) {
        fetch(bbUrl, {
            headers: {
                'Authorization': `Bearer ${memosOpenId}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
        }).then(res => {
            return res.json();
        }).then(resdata => {
            if (resdata && resdata.length > 0) {
                updateHTMl(resdata);
                var nowLength = resdata.length;
                if (nowLength < limit) {
                    let loadBtn = document.querySelector("button.button-load");
                    if (loadBtn) loadBtn.remove();
                    return;
                }
                mePage++;
                offset = limit * (mePage - 1);
                getNextList();
            } else {
                bbDom.innerHTML = '<div class="text-center text-muted">暂无数据</div>';
                let loadBtn = document.querySelector("button.button-load");
                if (loadBtn) loadBtn.remove();
            }
        }).catch(error => {
            bbDom.innerHTML = '<div class="text-center text-muted">加载失败，请检查网络连接</div>';
            let loadBtn = document.querySelector("button.button-load");
            if (loadBtn) loadBtn.remove();
        });
    } else {
        fetch(bbUrl).then(res => {
            return res.json();
        }).then(resdata => {
            if (resdata && resdata.length > 0) {
                updateHTMl(resdata);
                var nowLength = resdata.length;
                if (nowLength < limit) {
                    let loadBtn = document.querySelector("button.button-load");
                    if (loadBtn) loadBtn.remove();
                    return;
                }
                mePage++;
                offset = limit * (mePage - 1);
                getNextList();
            } else {
                bbDom.innerHTML = '<div class="text-center text-muted">暂无数据</div>';
                let loadBtn = document.querySelector("button.button-load");
                if (loadBtn) loadBtn.remove();
            }
        }).catch(error => {
            bbDom.innerHTML = '<div class="text-center text-muted">加载失败，请检查网络连接</div>';
            let loadBtn = document.querySelector("button.button-load");
            if (loadBtn) loadBtn.remove();
        });
    }
}

// 预加载下一页数据
function getNextList() {
    var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&rowStatus=NORMAL&limit=" + limit + "&offset=" + offset;
    fetch(bbUrl).then(res => res.json()).then(resdata => {
        nextDom = resdata;
        nextLength = nextDom.length;
        mePage++;
        offset = limit * (mePage - 1);
        if (nextLength < 1) {
            let loadBtn = document.querySelector("button.button-load");
            if (loadBtn) loadBtn.remove();
            return;
        }
    });
}

// 加载总 Memos 数
function meNums() {
    var bbUrl = memos + "api/v1/memo/stats?creatorId=" + bbMemo.creatorId;
    fetch(bbUrl).then(res => res.json()).then(resdata => {
        // 可以在这里显示总数
    });
}

// 插入 HTML
function updateHTMl(data, mode) {
    var result = "", resultAll = "";
    
    // 检查是否有token来显示编辑按钮
    var currentToken = localStorage.getItem('memos-access-token');
    if (currentToken) {
        hasLogin = 1;
    }
    
    const TAG_REG = /#([^#\s!.,;:?"'()]+)(?= )/g;
    const IMG_REG = /\!\[(.*?)\]\((.*?)\)/g; // content 内 md 格式图片
    
    // 配置 marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,           // 支持换行
            gfm: true,             // 启用GitHub风格的Markdown
            smartypants: false,
            langPrefix: 'language-',
            headerIds: false,
            mangle: false,
            sanitize: false,       // 允许HTML标签
            smartLists: true,      // 智能列表
            xhtml: false,
            pedantic: false,       // 不使用严格模式
            silent: true          // 静默错误
        });
        

    }
    
    for (var i = 0; i < data.length; i++) {
        var memoString = JSON.stringify(data[i]).replace(/"/g, '&quot;');
        var memo_id = data[i].id;
        var memoVis = data[i].visibility;
        var bbContREG = data[i].content
            .replace(TAG_REG, "")
            .replace(IMG_REG, '')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        if (typeof marked !== 'undefined') {
            bbContREG = marked.parse(bbContREG);
        }
        
        // 解析 content 内 md 格式图片
        var IMG_ARR = data[i].content.match(IMG_REG) || '';
        var IMG_ARR_Grid = '';
        if (IMG_ARR) {
            var IMG_ARR_Length = IMG_ARR.length;
            var IMG_ARR_Url = '';
            if (IMG_ARR_Length !== 1) {
                IMG_ARR_Grid = " grid grid-" + IMG_ARR_Length;
            }
            
            // 生成所有图片的HTML，CSS控制显示
            IMG_ARR.forEach((item, index) => {
                let imgSrc = item.replace(/!\[.*?\]\((.*?)\)/g, '$1');
                let remainingAttr = '';
                
                // 如果是第3张图片且总数超过3张，添加剩余数量属性
                if (index === 2 && IMG_ARR_Length > 3) {
                    remainingAttr = ` data-remaining="${IMG_ARR_Length - 3}"`;
                }
                
                IMG_ARR_Url += `<figure class="gallery-thumbnail"${remainingAttr}><img loading="lazy" decoding="async" class="img thumbnail-image" src="${imgSrc}"/></figure>`;
            });
            bbContREG += '<div class="resimg' + IMG_ARR_Grid + '" view-image>' + IMG_ARR_Url + '</div>';
        }
        
        // TAG 解析
        var tagArr = data[i].content.match(TAG_REG);
        var memosTag = '';
        
        if (tagArr) {
            memosTag = tagArr.map(function(tag) {
                var tagText = String(tag).replace(/[#]/g, '');
                return '<div class="memos-tag-dg" onclick="getTagNow(this)">#' + tagText + '</div>';
            }).join('');
        } else {
            memosTag = '<div class="memos-tag-dg">#日常</div>';
        }
        
        // 解析内置资源文件
        if (data[i].resourceList && data[i].resourceList.length > 0) {
            var resourceList = data[i].resourceList;
            var imgUrl = '', resUrl = '', resImgLength = 0;
            for (var j = 0; j < resourceList.length; j++) {
                var restype = resourceList[j].type.slice(0, 5);
                var resexlink = resourceList[j].externalLink;
                var resLink = '', fileId = '';
                if (resexlink) {
                    resLink = resexlink;
                } else {
                    fileId = resourceList[j].publicId || resourceList[j].filename;
                    resLink = memos + 'o/r/' + resourceList[j].id;
                }
                if (restype == 'image') {
                    let remainingAttr = '';
                    
                    // 计算总的图片数量
                    let totalImages = resourceList.filter(res => res.type.slice(0, 5) === 'image').length;
                    
                    // 如果是第3张图片且总数超过3张，添加剩余数量属性
                    if (resImgLength === 2 && totalImages > 3) {
                        remainingAttr = ` data-remaining="${totalImages - 3}"`;
                    }
                    
                    imgUrl += `<figure class="gallery-thumbnail"${remainingAttr}><img loading="lazy" decoding="async" class="img thumbnail-image" src="${resLink}"/></figure>`;
                    resImgLength = resImgLength + 1;
                }
                if (restype !== 'image') {
                    resUrl += '<a target="_blank" rel="noreferrer" href="' + resLink + '">' + resourceList[j].filename + '</a>';
                }
            }
            if (imgUrl) {
                var resImgGrid = "";
                if (resImgLength !== 1) {
                    resImgGrid = "grid grid-" + resImgLength;
                }
                bbContREG += '<div class="resimg ' + resImgGrid + '" view-image>' + imgUrl + '</div>';
            }
            if (resUrl) {
                bbContREG += '<p class="datasource">' + resUrl + '</p>';
            }
        }
        
        result += `
        <li class="bb-list-li img-hide" id="${memo_id}">
            <div class="memos-pl">
                <div class="memos_diaoyong_time">${typeof moment !== 'undefined' ? moment(data[i].createdTs * 1000).twitterLong() : new Date(data[i].createdTs * 1000).toLocaleString()}</div>`;
        
        if (hasLogin !== 0) {
            result += `<div class="memos-edit">
                <div class="memos-menu">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                    </svg>
                </div>
                <div class="memos-menu-d">
                    <div class="edit-btn" data-form="${memoString}" onclick="editMemo(this)">修改</div>
                    <div class="delete-btn" onclick="deleteMemo('${data[i].id}')">删除</div> 
                </div>
            </div>`;
        }
        
        result += `</div>       
            <div class="datacont" view-image>${bbContREG}</div>
            <div class="memos_diaoyong_top">
                <div class="memos-tag-wz">${memosTag}</div>
            </div>
        </li>`;
    }
    
    if (mode == "ONEDAY") {
        var bbBefore = "<li class='memos-oneday'><ul class='bb-list-ul'>";
        var bbAfter = "</ul></li>";
        resultAll = bbBefore + result + bbAfter;
        bbDom.insertAdjacentHTML('afterbegin', resultAll);
    } else {
        var bbBefore = "<section class='bb-timeline'><ul class='bb-list-ul'>";
        var bbAfter = "</ul></section>";
        resultAll = bbBefore + result + bbAfter;
        bbDom.insertAdjacentHTML('beforeend', resultAll);
        
        if (document.querySelector('button.button-load .btn-content')) {
            document.querySelector('button.button-load .btn-content').textContent = '看更多 ...';
        }
        
        // 初始化ViewImage灯箱
        if (typeof window.ViewImage !== 'undefined') {
            setTimeout(function() {
                window.ViewImage.init('[view-image] img');
            }, 100);
        }
        
        // 初始化图片展开折叠功能
        initImageToggle();
    }
}

// TAG 筛选
function getTagNow(e) {
    let tagName = e.innerHTML.replace('#', '');
    let domClass = document.getElementById("bber");
    window.scrollTo({
        top: domClass.offsetTop - 30,
        behavior: "smooth"
    });
    let tagHtmlNow = `<div class='memos-tag-sc-2' onclick='javascript:location.reload();'><div class='memos-tag-sc-1'>标签筛选:</div><div class='memos-tag-sc'>${e.innerHTML}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-auto ml-1 opacity-40"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></div></div>`;
    document.querySelector('#tag-list').innerHTML = tagHtmlNow;
    let bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&tag=" + tagName + "&limit=20";
    fetch(bbUrl).then(res => res.json()).then(resdata => {
        document.querySelector(bbMemo.domId).innerHTML = "";
        if (document.querySelector("button.button-load")) {
            document.querySelector("button.button-load").remove();
        }
        updateHTMl(resdata);
    });
}

// 编辑功能相关代码
var memosEditor = {
    isVisible: false,
    
    // 初始化编辑器
    init: function() {
        this.createEditor();
        this.bindEvents();
    },
    
    // 创建编辑器HTML
    createEditor: function() {
        var editorHTML = `
        <div id="memos-editor" class="memos-editor" style="display: none;">
            <div class="memos-editor-overlay"></div>
            <div class="memos-editor-modal">
                <div class="memos-editor-header">
                    <h3>输入 Access Token</h3>
                    <button class="memos-editor-close">&times;</button>
                </div>
                <div class="memos-editor-body">
                    <div class="memos-editor-form">
                        <div class="form-group">
                            <label for="memos-token">Access Token:</label>
                            <input type="password" id="memos-token" placeholder="输入你的 Access Token" autocomplete="off">
                            <div class="token-help">
                                <small>在 Memos 设置中生成 Access Token，用于编辑功能</small>
                            </div>
                        </div>
                    </div>
                    <div class="memos-editor-actions">
                        <button class="btn-cancel">取消</button>
                        <button class="btn-save">保存并启用编辑</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', editorHTML);
    },
    
    // 绑定事件
    bindEvents: function() {
        var self = this;
        
        // 快捷键监听 (Ctrl/Cmd + E)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                self.show();
            }
        });
        
        // 移动端双击事件
        var touchCount = 0;
        var touchTimer = null;
        var lastTapTime = 0;
        var touchStartX = 0;
        var touchStartY = 0;
        var TOUCH_THRESHOLD = 10;
        
        // 检测是否为移动设备
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0);
        
        if (isMobile) {
            document.addEventListener('touchstart', function(e) {
                var touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                
                var currentTime = new Date().getTime();
                var tapLength = currentTime - lastTapTime;
                
                if (tapLength < 300 && tapLength > 0) {
                    // 检查两次点击的位置是否接近
                    var moveDistance = Math.sqrt(
                        Math.pow(touch.clientX - touchStartX, 2) +
                        Math.pow(touch.clientY - touchStartY, 2)
                    );

                    if (moveDistance < TOUCH_THRESHOLD) {
                        // 只在首页响应双击
                        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                            e.preventDefault();
                            self.show();
                        }
                        touchCount = 0;
                        clearTimeout(touchTimer);
                    }
                }
                
                lastTapTime = currentTime;
                
                // 清除之前的超时
                clearTimeout(touchTimer);
                
                // 设置新的超时
                touchTimer = setTimeout(function() {
                    touchCount = 0;
                }, 300);
            }, { passive: false });

            // 防止触摸移动时触发
            document.addEventListener('touchmove', function(e) {
                var touch = e.touches[0];
                var moveDistance = Math.sqrt(
                    Math.pow(touch.clientX - touchStartX, 2) +
                    Math.pow(touch.clientY - touchStartY, 2)
                );

                if (moveDistance > TOUCH_THRESHOLD) {
                    touchCount = 0;
                    clearTimeout(touchTimer);
                }
            }, { passive: true });

            // 触摸结束时重置状态
            document.addEventListener('touchend', function() {
                touchCount++;
                if (touchCount === 1) {
                    touchTimer = setTimeout(function() {
                        touchCount = 0;
                    }, 300);
                }
            }, { passive: true });
        }
        
        // 关闭按钮
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('memos-editor-close') || 
                e.target.classList.contains('memos-editor-overlay') ||
                e.target.classList.contains('btn-cancel')) {
                self.hide();
            }
        });
        
        // 保存按钮
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-save')) {
                self.save();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && self.isVisible) {
                self.hide();
            }
        });
    },
    
    // 显示编辑器
    show: function() {
        var editor = document.getElementById('memos-editor');
        if (editor) {
            editor.style.display = 'flex';
            this.isVisible = true;
            
            // 加载已保存的token
            var savedToken = localStorage.getItem('memos-access-token');
            if (savedToken) {
                document.getElementById('memos-token').value = savedToken;
            }
            
            // 聚焦到token输入框
            setTimeout(() => {
                document.getElementById('memos-token').focus();
            }, 100);
        }
    },
    
    // 隐藏编辑器
    hide: function() {
        var editor = document.getElementById('memos-editor');
        if (editor) {
            editor.style.display = 'none';
            this.isVisible = false;
        }
    },
    
    // 保存配置
    save: function() {
        var token = document.getElementById('memos-token').value.trim();
        
        if (!token) {
            cocoMessage.error('请输入 Access Token');
            return;
        }
        
        // 使用默认配置
        var server = bbMemo.memos;
        var creatorId = bbMemo.creatorId;
        
        // 保存到localStorage
        localStorage.setItem('memos-access-token', token);
        localStorage.setItem('memos-access-path', server);
        localStorage.setItem('memos-creator-id', creatorId);
        localStorage.setItem('memos-editor-display', 'show');
        
        // 测试连接
        this.testConnection(server, token, creatorId);
    },
    
    // 测试连接
    testConnection: function(server, token, creatorId) {
        var self = this;
        var testUrl = server + 'api/v1/memo?creatorId=' + creatorId + '&limit=1';
        
        fetch(testUrl, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('连接失败');
        })
        .then(data => {
            cocoMessage.success('连接成功！编辑模式已启用', () => {
                self.hide();
                // 创建发布框
                self.createPublishBox();
                // 重新加载数据
                location.reload();
            });
        })
        .catch(error => {
            cocoMessage.error('连接失败，请检查配置信息');
        });
    },
    
    // 创建发布框
    createPublishBox: function() {
        var publishBoxHTML = `
        <div id="memos-publish-box" class="memos-publish-box">
            <div class="publish-header">
                <div class="publish-toolbar">
                    <div class="toolbar-group">
                        <div class="toolbar-btn tag-selector-wrapper" title="选择标签">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                            <div class="tag-dropdown">
                                <div class="tag-search-wrapper">
                                    <input type="text" class="tag-search-input" placeholder="搜索标签...">
                                </div>
                                <div class="tag-options-list"></div>
                            </div>
                        </div>
                        <button type="button" class="toolbar-btn" data-action="link" title="插入链接">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="image-url" title="插入图片链接">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn upload-btn" title="上传图片">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-action="inline-code" title="行内代码">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16,18 22,12 16,6"/>
                                <polyline points="8,6 2,12 8,18"/>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="code-block" title="代码块">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="publish-body">
                <textarea id="publish-content" class="publish-textarea" placeholder="写点什么..." rows="3"></textarea>
                <div id="memos-tag-menu"></div>
                <div class="memos-image-list d-flex flex-fill line-xl"></div>
                <div class="publish-actions">
                    <div class="publish-tools">
                        <select id="publish-visibility" class="visibility-select">
                            <option value="PUBLIC">公开</option>
                            <option value="PRIVATE">私有</option>
                        </select>
                        <button type="button" class="toolbar-btn" data-action="private-mode" title="私有浏览模式">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                        <button type="button" class="toolbar-btn" data-action="oneday-mode" title="回忆模式">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                        </button>
                        <span class="shortcut-tip">Ctrl+Enter 发布</span>
                    </div>
                    <button id="publish-btn" class="publish-btn">发布</button>
                </div>
            </div>
        </div>`;
        
        // 插入到bber容器之前
        var bberContainer = document.getElementById('bber');
        if (bberContainer) {
            bberContainer.insertAdjacentHTML('beforebegin', publishBoxHTML);
            this.bindPublishEvents();
        }
    },
    
    // 绑定发布框事件
    bindPublishEvents: function() {
        var publishBtn = document.getElementById('publish-btn');
        var publishContent = document.getElementById('publish-content');
        
        if (publishBtn && publishContent) {
            // 发布按钮点击事件
            publishBtn.addEventListener('click', this.publishMemo.bind(this));
            
            // 文本框自动调整高度
            publishContent.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
            
            // Ctrl+Enter 快捷发布
            publishContent.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    publishBtn.click();
                }
            });
            
            // 工具栏按钮事件
            this.bindToolbarEvents();
        }
    },
    
    // 绑定工具栏事件
    bindToolbarEvents: function() {
        var self = this;
        var toolbarBtns = document.querySelectorAll('.toolbar-btn:not(.upload-btn)');
        
        toolbarBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var action = this.getAttribute('data-action');
                self.handleToolbarAction(action, this);
            });
        });
        
        // 图片上传按钮事件
        var uploadBtn = document.querySelector('.upload-btn');
        var fileInput = document.getElementById('image-upload-input');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                fileInput.click();
            });
            
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    self.uploadImage(e.target.files[0]);
                    // 清空文件输入，允许重复选择同一文件
                    e.target.value = '';
                }
            });
        }
        
        // 加载标签列表
        this.loadTagList();
        
        // 绑定标签选择器事件
        this.bindTagSelector();
    },
    
    // 处理工具栏操作
    handleToolbarAction: function(action, button) {
        var textarea = document.getElementById('publish-content');
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var selectedText = textarea.value.substring(start, end);
        var newText = '';
        var cursorPos = start;
        
        switch(action) {
                
            case 'link':
                if (selectedText) {
                    newText = '[' + selectedText + '](URL)';
                    cursorPos = start + selectedText.length + 3;
                } else {
                    newText = '[链接文字](URL)';
                    cursorPos = start + 1;
                }
                break;
                
            case 'image-url':
                if (selectedText) {
                    newText = '![' + selectedText + '](图片URL)';
                    cursorPos = start + selectedText.length + 4;
                } else {
                    newText = '![图片描述](图片URL)';
                    cursorPos = start + 2;
                }
                break;
                

                
            case 'inline-code':
                if (selectedText) {
                    newText = '`' + selectedText + '`';
                    cursorPos = end + 2;
                } else {
                    newText = '`代码`';
                    cursorPos = start + 1;
                }
                break;
                
            case 'code-block':
                if (selectedText) {
                    newText = '```\n' + selectedText + '\n```';
                    cursorPos = end + 6;
                } else {
                    newText = '```\n代码块\n```';
                    cursorPos = start + 4;
                }
                break;
                
            case 'private-mode':
                this.togglePrivateMode();
                return;
                
            case 'oneday-mode':
                this.toggleOneDayMode();
                return;
        }
        
        // 插入文本
        this.insertTextAtCursor(textarea, newText, cursorPos, action === 'link' || action === 'image-url' ? newText.length - 1 : cursorPos);
    },
    
    // 切换私有浏览模式
    togglePrivateMode: function() {
        var privateBtn = document.querySelector('[data-action="private-mode"]');
        var isPrivate = privateBtn.classList.contains('active');
        
        if (!isPrivate) {
            privateBtn.classList.add('active');
            localStorage.setItem('memos-mode', 'NOPUBLIC');
            reloadList('NOPUBLIC');
            cocoMessage.success('已进入私有浏览模式');
        } else {
            privateBtn.classList.remove('active');
            localStorage.removeItem('memos-mode');
            reloadList();
            cocoMessage.success('已退出私有浏览模式');
        }
    },
    
    // 切换回忆模式
    toggleOneDayMode: function() {
        var oneDayBtn = document.querySelector('[data-action="oneday-mode"]');
        var isOneDay = oneDayBtn.classList.contains('active');
        
        if (!isOneDay) {
            oneDayBtn.classList.add('active');
            localStorage.setItem('memos-oneday', 'open');
            reloadList('ONEDAY');
            cocoMessage.success('已开启回忆模式');
        } else {
            oneDayBtn.classList.remove('active');
            localStorage.removeItem('memos-oneday');
            reloadList();
            cocoMessage.success('已退出回忆模式');
        }
    },
    
    // 在光标位置插入文本
    insertTextAtCursor: function(textarea, text, cursorStart, cursorEnd) {
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var value = textarea.value;
        
        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(cursorStart, cursorEnd || cursorStart);
        
        // 触发高度调整
        textarea.dispatchEvent(new Event('input'));
    },
    
    // 上传图片
    uploadImage: function(file) {
        var token = localStorage.getItem('memos-access-token');
        var server = localStorage.getItem('memos-access-path');
        
        if (!token || !server) {
            cocoMessage.error('请先配置 Access Token');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            cocoMessage.error('请选择图片文件');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB限制
            cocoMessage.error('图片大小不能超过10MB');
            return;
        }
        
        // 获取当前资源列表
        var memosResourceListNow = JSON.parse(localStorage.getItem("memos-resource-list") || "[]");
        
        var formData = new FormData();
        formData.append('file', file, file.name);
        
        cocoMessage.info('图片上传中...');
        
        fetch(server + 'api/v1/resource/blob', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('上传失败: ' + response.status);
        })
        .then(data => {
            if (data.id) {
                var resexlink = data.externalLink;
                var imgLink = '', fileId = '';
                if (resexlink) {
                    imgLink = resexlink;
                } else {
                    fileId = data.publicId || data.filename;
                    imgLink = server + 'o/r/' + data.id;
                }
                
                // 创建图片预览元素
                var imageList = '';
                imageList += '<div data-id="' + data.id + '" class="imagelist-item d-flex text-xs mt-2 mr-2" onclick="deleteImage(this)">';
                imageList += '<div class="d-flex memos-up-image" style="background-image:url(' + imgLink + ')">';
                imageList += '<span class="d-none">' + fileId + '</span>';
                imageList += '</div></div>';
                
                // 添加到图片列表
                var imageListContainer = document.querySelector(".memos-image-list");
                if (imageListContainer) {
                    imageListContainer.insertAdjacentHTML('afterbegin', imageList);
                }
                
                cocoMessage.success('上传成功', function() {
                    // 更新资源列表
                    memosResourceListNow.push(data.id);
                    localStorage.setItem("memos-resource-list", JSON.stringify(memosResourceListNow));
                    // 启用拖拽功能
                    imageListDrag();
                });
            }
        })
        .catch(error => {
            cocoMessage.error('图片上传失败: ' + error.message);
        });
    },
    
    // 发布memo
    publishMemo: function() {
        var content = document.getElementById('publish-content').value.trim();
        var visibility = document.getElementById('publish-visibility').value;
        var token = localStorage.getItem('memos-access-token');
        var server = localStorage.getItem('memos-access-path');
        
        if (!content) {
            cocoMessage.error('请输入内容');
            return;
        }
        
        if (!token || !server) {
            cocoMessage.error('请先配置 Access Token');
            return;
        }
        
        var publishBtn = document.getElementById('publish-btn');
        var originalText = publishBtn.textContent;
        
        // 检查是否为编辑模式
        if (isEditMode && currentEditingMemo) {
            // 编辑模式：更新现有memo
            publishBtn.textContent = '保存中...';
            publishBtn.disabled = true;
            
            updateMemo(
                currentEditingMemo.id,
                content,
                visibility,
                currentEditingMemo.resourceList ? currentEditingMemo.resourceList.map(r => r.id) : [],
                currentEditingMemo.relationList || []
            );
        } else {
            // 发布模式：创建新memo
            var publishUrl = server + 'api/v1/memo';
            
            // 显示发布中状态
            publishBtn.textContent = '发布中...';
            publishBtn.disabled = true;
            
            // 获取资源列表
            var memosResource = JSON.parse(localStorage.getItem("memos-resource-list") || "[]");
            
            fetch(publishUrl, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    visibility: visibility,
                    resourceIdList: memosResource,
                    relationList: []
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('发布失败');
            })
            .then(data => {
                cocoMessage.success('发布成功', () => {
                    // 清空输入框和图片列表
                    document.getElementById('publish-content').value = '';
                    document.getElementById('publish-content').style.height = 'auto';
                    var imageListContainer = document.querySelector(".memos-image-list");
                    if (imageListContainer) {
                        imageListContainer.innerHTML = '';
                    }
                    // 清空资源列表
                    localStorage.removeItem("memos-resource-list");
                    localStorage.removeItem("memos-relation-list");
                    // 重新加载数据
                    location.reload();
                });
            })
            .catch(error => {
                cocoMessage.error('发布失败: ' + error.message);
            })
            .finally(() => {
                // 恢复按钮状态
                publishBtn.textContent = originalText;
                publishBtn.disabled = false;
            });
        }
    },
    
    // 加载标签列表
    loadTagList: function() {
        var token = localStorage.getItem('memos-access-token');
        var server = localStorage.getItem('memos-access-path');
        
        if (!token || !server) {
            return;
        }
        
        var tagUrl = server + 'api/v1/tag';
        
        fetch(tagUrl, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('获取标签失败');
        })
        .then(data => {
            var taglist = "";
            data.map(function(t) {
                taglist += '<div class="memos-tag d-flex text-xs mt-2 mr-2"><a class="d-flex px-2 justify-content-center" onclick="setMemoTag(this)">#' + t + '</a></div>';
            });
            
            // 初始化标签自动补全（使用隐藏的标签列表）
            var hiddenTagList = document.createElement('div');
            hiddenTagList.className = 'memos-tag-list d-none';
            hiddenTagList.innerHTML = taglist;
            document.body.appendChild(hiddenTagList);
            
            this.initTagAutoComplete();
            
            // 更新标签选择器的标签列表
            this.updateTagSelectorTags(data);
        })
        .catch(error => {
            // 加载标签失败
        });
    },
    
    // 初始化标签自动补全
    initTagAutoComplete: function() {
        var tagListElement = document.querySelector('.memos-tag-list');
        var tagMenu = document.getElementById('memos-tag-menu');
        var memosTextarea = document.getElementById('publish-content');
        var selectedTagIndex = -1;
        
        if (!tagListElement || !tagMenu || !memosTextarea) {
            return;
        }
        
        var getMatchingTags = function(tagPrefix) {
            var allTags = Array.from(tagListElement.querySelectorAll('.memos-tag a')).map(function(tagLink) {
                return tagLink.textContent;
            });
            return allTags.filter(function(tag) {
                return tag.toLowerCase().includes(tagPrefix.toLowerCase());
            });
        };
        
        var hideTagMenu = function() {
            tagMenu.style.display = 'none';
        };
        
        var showTagMenu = function(matchingTags) {
            tagMenu.innerHTML = matchingTags.map(function(tag) {
                return '<div class="tag-option">' + tag + '</div>';
            }).join('');
            tagMenu.style.cssText = 'display: block;';
            selectedTagIndex = -1;
        };
        
        var insertSelectedTag = function(tag) {
            var inputValue = memosTextarea.value;
            var cursorPosition = memosTextarea.selectionStart;
            
            var textBeforeCursor = inputValue.substring(0, cursorPosition);
            var lines = textBeforeCursor.split('\n');
            var lastLine = lines[lines.length - 1];
            var wordsBeforeCursor = lastLine.split(/\s+/);
            
            wordsBeforeCursor.pop();
            
            var newLastLine = wordsBeforeCursor.join(' ') + ' ' + tag + ' ';
            var newValue = inputValue.replace(lastLine, newLastLine);
            
            memosTextarea.value = newValue;
            
            var newCursorPosition = newValue.lastIndexOf(tag) + tag.length + 1;
            
            hideTagMenu();
            selectedTagIndex = -1;
            
            memosTextarea.focus();
            memosTextarea.setSelectionRange(newCursorPosition, newCursorPosition);
        };
        
        // 输入事件监听
        memosTextarea.addEventListener('input', function() {
            var inputValue = memosTextarea.value;
            var cursorPosition = memosTextarea.selectionStart;
            
            var lastWord = inputValue.substring(0, cursorPosition).split(/\s+/).pop();
            
            if (lastWord && lastWord.includes('#')) {
                var matchingTags = getMatchingTags(lastWord);
                if (matchingTags.length > 0) {
                    showTagMenu(matchingTags);
                } else {
                    hideTagMenu();
                }
            } else {
                hideTagMenu();
            }
        });
        
        // 键盘事件监听
        memosTextarea.addEventListener('keydown', function(event) {
            var keyCode = event.keyCode;
            
            if (tagMenu.style.display === 'block') {
                var matchingTags = Array.from(tagMenu.querySelectorAll('.tag-option')).map(function(tag) {
                    return tag.textContent;
                });
                
                if (keyCode === 38 || keyCode === 40 || keyCode === 37 || keyCode === 39) {
                    event.preventDefault();
                    if (keyCode === 37 || keyCode === 39) {
                        var direction = keyCode === 37 ? -1 : 1;
                        selectedTagIndex = (selectedTagIndex + direction + matchingTags.length) % matchingTags.length;
                    } else {
                        selectedTagIndex = (selectedTagIndex + (keyCode === 38 ? -1 : 1) + matchingTags.length) % matchingTags.length;
                    }
                    Array.from(tagMenu.querySelectorAll('.tag-option')).forEach(function(option, index) {
                        option.classList.toggle('selected', index === selectedTagIndex);
                    });
                } else if (keyCode === 13 && selectedTagIndex !== -1) {
                    event.preventDefault();
                    insertSelectedTag(matchingTags[selectedTagIndex]);
                }
            }
        });
        
        // 点击事件监听
        tagMenu.addEventListener('click', function(event) {
            if (event.target.classList.contains('tag-option')) {
                insertSelectedTag(event.target.textContent);
            }
        });
    },
    
    // 绑定标签选择器事件
    bindTagSelector: function() {
        var tagSelector = document.querySelector('.tag-selector-wrapper');
        var tagDropdown = document.querySelector('.tag-dropdown');
        var tagSearchInput = document.querySelector('.tag-search-input');
        var tagOptionsList = document.querySelector('.tag-options-list');
        var memosTextarea = document.getElementById('publish-content');
        
        if (!tagSelector || !tagDropdown || !tagSearchInput || !tagOptionsList || !memosTextarea) {
            return;
        }
        
        var allTags = window.memosTagSelectorTags || [];
        var isDropdownOpen = false;
        
        // 设置全局变量引用
        window.memosTagSelectorTags = allTags;
        
        // 点击标签按钮切换下拉框
        tagSelector.addEventListener('click', function(e) {
            e.stopPropagation();
            isDropdownOpen = !isDropdownOpen;
            tagDropdown.style.display = isDropdownOpen ? 'block' : 'none';
            
            if (isDropdownOpen) {
                tagSearchInput.focus();
                updateTagOptions('');
            }
        });
        
        // 搜索输入事件
        tagSearchInput.addEventListener('input', function(e) {
            updateTagOptions(e.target.value);
        });
        
        // 搜索框键盘事件
        tagSearchInput.addEventListener('keydown', function(e) {
            var tagOptions = tagOptionsList.querySelectorAll('.tag-option-item');
            var selectedOption = tagOptionsList.querySelector('.tag-option-item.selected');
            var selectedIndex = selectedOption ? Array.from(tagOptions).indexOf(selectedOption) : -1;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (selectedIndex < tagOptions.length - 1) {
                    if (selectedOption) selectedOption.classList.remove('selected');
                    tagOptions[selectedIndex + 1].classList.add('selected');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (selectedIndex > 0) {
                    if (selectedOption) selectedOption.classList.remove('selected');
                    tagOptions[selectedIndex - 1].classList.add('selected');
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedOption) {
                    insertTagToTextarea(selectedOption.textContent);
                    closeDropdown();
                }
            }
        });
        
        // 点击标签选项
        tagOptionsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-option-item')) {
                var tagText = e.target.textContent;
                insertTagToTextarea(tagText);
                closeDropdown();
            }
        });
        
        // 点击外部关闭下拉框
        document.addEventListener('click', function(e) {
            if (!tagSelector.contains(e.target)) {
                closeDropdown();
            }
        });
        
        // ESC键关闭下拉框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isDropdownOpen) {
                closeDropdown();
            }
        });
        
        function updateTagOptions(searchTerm) {
            var currentTags = window.memosTagSelectorTags || [];
            var filteredTags = currentTags.filter(function(tag) {
                return tag.toLowerCase().includes(searchTerm.toLowerCase());
            });
            
            var optionsHtml = '';
            if (filteredTags.length === 0) {
                optionsHtml = '<div class="no-tags-message">暂无匹配的标签</div>';
            } else {
                filteredTags.forEach(function(tag, index) {
                    var selectedClass = index === 0 ? ' selected' : '';
                    optionsHtml += '<div class="tag-option-item' + selectedClass + '">' + tag + '</div>';
                });
            }
            
            tagOptionsList.innerHTML = optionsHtml;
        }
        
        function insertTagToTextarea(tagText) {
            var cursorPos = memosTextarea.selectionStart;
            var textBefore = memosTextarea.value.substring(0, cursorPos);
            var textAfter = memosTextarea.value.substring(cursorPos);
            
            // 确保标签前有空格（如果不是在行首）
            var tagToInsert = tagText;
            if (textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n')) {
                tagToInsert = ' ' + tagToInsert;
            }
            
            // 确保标签后有空格
            if (!tagToInsert.endsWith(' ')) {
                tagToInsert += ' ';
            }
            
            memosTextarea.value = textBefore + tagToInsert + textAfter;
            
            // 设置光标位置
            var newCursorPos = cursorPos + tagToInsert.length;
            memosTextarea.focus();
            memosTextarea.setSelectionRange(newCursorPos, newCursorPos);
            
            // 触发高度调整
            memosTextarea.dispatchEvent(new Event('input'));
        }
        
        function closeDropdown() {
            isDropdownOpen = false;
            tagDropdown.style.display = 'none';
            tagSearchInput.value = '';
        }
        
        // 标签数据通过全局变量 window.memosTagSelectorTags 管理
    },
    
    // 更新标签选择器标签数据
    updateTagSelectorTags: function(tags) {
        // 更新全局标签数据
        window.memosTagSelectorTags = tags.map(function(tag) {
            return '#' + tag;
        });
    }
};

// 编辑状态相关变量
var isEditMode = false;
var currentEditingMemo = null;
var memosOldSelect = null;

// 编辑和删除功能
function editMemo(element) {
    var memoData = JSON.parse(element.getAttribute('data-form'));
    var token = localStorage.getItem('memos-access-token');
    var server = localStorage.getItem('memos-access-path');
    
    if (!token || !server) {
        cocoMessage.error('请先配置 Access Token');
        memosEditor.show();
        return;
    }
    
    // 进入编辑模式
    enterEditMode(memoData);
}

// 进入编辑模式
function enterEditMode(memoData) {
    if (!document.getElementById('memos-publish-box')) {
        memosEditor.createPublishBox();
    }
    
    var publishContent = document.getElementById('publish-content');
    var publishVisibility = document.getElementById('publish-visibility');
    var publishBtn = document.getElementById('publish-btn');
    var imageListContainer = document.querySelector(".memos-image-list");
    
    if (publishContent && publishVisibility && publishBtn) {
        // 保存当前编辑的memo数据
        currentEditingMemo = memoData;
        isEditMode = true;
        
        // 清空并重新填充图片列表
        if (imageListContainer) {
            imageListContainer.innerHTML = '';
        }
        
        // 处理现有的资源文件
        var memosResource = [];
        var imageList = "";
        if (memoData.resourceList && memoData.resourceList.length > 0) {
            var server = localStorage.getItem('memos-access-path');
            for (var i = 0; i < memoData.resourceList.length; i++) {
                var resource = memoData.resourceList[i];
                var resexlink = resource.externalLink;
                var imgLink = '', fileId = '';
                if (resexlink) {
                    imgLink = resexlink;
                } else {
                    fileId = resource.publicId || resource.filename;
                    imgLink = server + 'o/r/' + resource.id;
                }
                memosResource.push(resource.id);
                imageList += '<div data-id="' + resource.id + '" class="imagelist-item d-flex text-xs mt-2 mr-2" onclick="deleteImage(this)">';
                imageList += '<div class="d-flex memos-up-image" style="background-image:url(' + imgLink + ')">';
                imageList += '<span class="d-none">' + fileId + '</span>';
                imageList += '</div></div>';
            }
            
            // 保存资源列表到localStorage
            localStorage.setItem("memos-resource-list", JSON.stringify(memosResource));
            if (imageListContainer) {
                imageListContainer.insertAdjacentHTML('afterbegin', imageList);
            }
        }
        
        // 填充编辑内容
        publishContent.value = memoData.content;
        publishVisibility.value = memoData.visibility;
        
        // 调整文本框高度
        publishContent.style.height = 'auto';
        publishContent.style.height = publishContent.scrollHeight + 'px';
        
        // 更改按钮文字和样式
        publishBtn.textContent = '更新';
        publishBtn.className = 'publish-btn edit-mode';
        
        // 创建编辑按钮容器
        if (!document.getElementById('edit-buttons-container')) {
            var editButtonsContainer = document.createElement('div');
            editButtonsContainer.id = 'edit-buttons-container';
            editButtonsContainer.className = 'edit-buttons-container';
            
            // 创建取消按钮
            var cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancel-edit-btn';
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = exitEditMode;
            
            // 将发布按钮移到容器中
            var publishBtnParent = publishBtn.parentNode;
            publishBtnParent.removeChild(publishBtn);
            publishBtn.textContent = '更新';
            
            // 添加按钮到容器
            editButtonsContainer.appendChild(cancelBtn);
            editButtonsContainer.appendChild(publishBtn);
            
            // 将容器添加到原来发布按钮的位置
            publishBtnParent.appendChild(editButtonsContainer);
        }
        
        // 滚动到编辑框
        document.getElementById('memos-publish-box').scrollIntoView({ behavior: 'smooth' });
        publishContent.focus();
    }
}

// 退出编辑模式
function exitEditMode() {
    isEditMode = false;
    currentEditingMemo = null;
    
    var publishContent = document.getElementById('publish-content');
    var publishVisibility = document.getElementById('publish-visibility');
    var publishBtn = document.getElementById('publish-btn');
    var cancelBtn = document.getElementById('cancel-edit-btn');
    var imageListContainer = document.querySelector(".memos-image-list");
    
    if (publishContent) {
        publishContent.value = '';
        publishContent.style.height = 'auto';
    }
    
    if (publishVisibility) {
        publishVisibility.value = 'PUBLIC';
    }
    
    // 恢复原始按钮布局
    var editButtonsContainer = document.getElementById('edit-buttons-container');
    if (editButtonsContainer && publishBtn) {
        // 将发布按钮移回原位置
        var publishBtnParent = editButtonsContainer.parentNode;
        publishBtnParent.removeChild(editButtonsContainer);
        
        publishBtn.textContent = '发布';
        publishBtn.className = 'publish-btn';
        publishBtnParent.appendChild(publishBtn);
    }
    
    // 清空图片列表和资源列表
    if (imageListContainer) {
        imageListContainer.innerHTML = '';
    }
    localStorage.removeItem("memos-resource-list");
    localStorage.removeItem("memos-relation-list");
}

// 更新memo
function updateMemo(memoId, content, visibility, resourceList, relationList) {
    var token = localStorage.getItem('memos-access-token');
    var server = localStorage.getItem('memos-access-path');
    
    if (!token || !server) {
        cocoMessage.error('请先配置 Access Token');
        return;
    }
    
    var updateUrl = server + 'api/v1/memo/' + memoId;
    
    fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: memoId,
            content: content,
            visibility: visibility,
            resourceIdList: resourceList || [],
            relationList: relationList || []
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('更新失败');
    })
    .then(data => {
        cocoMessage.success('更新成功', () => {
            exitEditMode();
            location.reload();
        });
    })
    .catch(error => {
        cocoMessage.error('更新失败: ' + error.message);
    });
}



// 重新加载列表（支持不同模式）
function reloadList(mode) {
    var bberDom = document.querySelector(bbMemo.domId);
    if (bberDom) {
        bberDom.innerHTML = '';
        bbDom = bberDom; // 更新全局bbDom引用
        
        // 重置分页
        mePage = 1;
        offset = 0;
        nextLength = 0;
        nextDom = '';
        
        // 根据模式加载不同的数据
        if (mode === "NOPUBLIC") {
            // 加载私有模式数据
            getPrivateList();
        } else if (mode === "ONEDAY") {
            // 加载回忆模式数据
            getOneDayList();
        } else {
            // 加载正常数据
            getFirstList();
        }
    }
}

// 获取私有列表
function getPrivateList() {
    var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&visibility=PRIVATE&limit=" + limit;
    var token = localStorage.getItem('memos-access-token');
    
    if (!token) {
        cocoMessage.error('请先配置 Access Token');
        return;
    }
    
    fetch(bbUrl, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(resdata => {
        updateHTMl(resdata);
    })
    .catch(error => {
        cocoMessage.error('加载私有数据失败');
    });
}

// 获取回忆列表（随机一条历史记录）
function getOneDayList() {
    var bbUrl = memos + "api/v1/memo?creatorId=" + bbMemo.creatorId + "&rowStatus=NORMAL&limit=100";
    var token = localStorage.getItem('memos-access-token');
    
    if (!token) {
        cocoMessage.error('请先配置 Access Token');
        return;
    }
    
    fetch(bbUrl, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(resdata => {
        if (resdata.length > 0) {
            // 随机选择一条记录
            var randomIndex = Math.floor(Math.random() * resdata.length);
            var randomMemo = [resdata[randomIndex]];
            updateHTMl(randomMemo, "ONEDAY");
        }
    })
    .catch(error => {
        cocoMessage.error('加载回忆数据失败');
    });
}

function deleteMemo(memoId) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    var token = localStorage.getItem('memos-access-token');
    var server = localStorage.getItem('memos-access-path');
    
    if (!token || !server) {
        cocoMessage.error('请先配置 Access Token');
        return;
    }
    
    var deleteUrl = server + 'api/v1/memo/' + memoId;
    
    fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            cocoMessage.success('删除成功', () => {
                location.reload();
            });
        } else {
            throw new Error('删除失败');
        }
    })
    .catch(error => {
        cocoMessage.error('删除失败: ' + error.message);
    });
}



function updateMemo(memoId, content, originalData) {
    var token = localStorage.getItem('memos-access-token');
    var server = localStorage.getItem('memos-access-path');
    
    var updateUrl = server + 'api/v1/memo/' + memoId;
    
    fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: memoId,
            content: content,
            visibility: originalData.visibility,
            resourceIdList: originalData.resourceList ? originalData.resourceList.map(r => r.id) : [],
            relationList: originalData.relationList || []
        })
    })
    .then(response => {
        if (response.ok) {
            cocoMessage.success('更新成功', () => {
                location.reload();
            });
        } else {
            throw new Error('更新失败');
        }
    })
    .catch(error => {
        cocoMessage.error('更新失败: ' + error.message);
    });
}

// 设置标签到文本框
function setMemoTag(e) {
    var memoTag = e.textContent + " ";
    var memosTextarea = document.getElementById('publish-content');
    if (memosTextarea) {
        memosTextarea.value += memoTag;
        memosTextarea.focus();
        // 触发高度调整
        memosTextarea.dispatchEvent(new Event('input'));
    }
}

// 删除图片
function deleteImage(e) {
    if (e) {
        var memoId = e.getAttribute("data-id");
        var memosResource = JSON.parse(localStorage.getItem("memos-resource-list") || "[]");
        var memosResourceList = memosResource.filter(function(item) { 
            return item != memoId; 
        });
        localStorage.setItem("memos-resource-list", JSON.stringify(memosResourceList));
        e.remove();
    }
}

// 图片上传缩略图拖动顺序
function imageListDrag() {
    // 获取包含所有图像元素的父元素
    const imageList = document.querySelector('.memos-image-list');
    if (!imageList) return;
    
    // 存储被拖动的元素
    let draggedItem = null;
    
    // 为每个图像元素添加拖拽事件监听器
    document.querySelectorAll('.memos-image-list .imagelist-item').forEach((item) => {
        item.draggable = true;
        
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '';
            draggedItem = null;
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem !== this) {
                // 重新排序元素
                if (this.nextElementSibling) {
                    this.parentNode.insertBefore(draggedItem, this.nextElementSibling);
                } else {
                    this.parentNode.appendChild(draggedItem);
                }
                
                // 更新资源列表顺序
                var memosResourceList = [];
                document.querySelectorAll('.memos-image-list .imagelist-item').forEach((item) => {
                    var itemId = Number(item.dataset.id);
                    memosResourceList.push(itemId);
                });
                localStorage.setItem("memos-resource-list", JSON.stringify(memosResourceList));
            }
        });
    });
}

// 页面加载完成后初始化编辑器
function initMemosEditor() {
    memosEditor.init();
    
    // 检查是否已有token，如果有则显示发布框
    var savedToken = localStorage.getItem('memos-access-token');
    if (savedToken) {
        memosEditor.createPublishBox();
        
        // 初始化资源列表
        var memosResource = [];
        var memosRelation = [];
        localStorage.setItem("memos-resource-list", JSON.stringify(memosResource));
        localStorage.setItem("memos-relation-list", JSON.stringify(memosRelation));
        
        // 检查并恢复模式状态
        var savedMode = localStorage.getItem('memos-mode');
        var savedOneDay = localStorage.getItem('memos-oneday');
        
        if (savedMode === 'NOPUBLIC') {
            setTimeout(() => {
                var privateBtn = document.querySelector('[data-action="private-mode"]');
                if (privateBtn) privateBtn.classList.add('active');
            }, 100);
        }
        
        if (savedOneDay === 'open') {
            setTimeout(() => {
                var oneDayBtn = document.querySelector('[data-action="oneday-mode"]');
                if (oneDayBtn) oneDayBtn.classList.add('active');
            }, 100);
        }
    }
}

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMemosEditor);
} else {
    initMemosEditor();
}

// 图片展开折叠功能
function initImageToggle() {
    // 为所有多图容器添加展开折叠功能
    const imageGrids = document.querySelectorAll('.resimg[class*="grid-"]:not(.grid-2):not(.grid-3)');
    
    imageGrids.forEach(grid => {
        // 跳过已经初始化的网格
        if (grid.hasAttribute('data-toggle-initialized')) {
            return;
        }
        
        grid.setAttribute('data-toggle-initialized', 'true');
        
        // 添加展开按钮点击事件（第3张图片的遮罩）
        const thirdImage = grid.querySelector('.gallery-thumbnail:nth-child(3)');
        if (thirdImage && thirdImage.hasAttribute('data-remaining')) {
            thirdImage.addEventListener('click', function(e) {
                // 如果网格是折叠状态，展开它
                if (!grid.classList.contains('expanded')) {
                    e.preventDefault(); // 阻止图片查看器打开
                    e.stopPropagation();
                    expandImageGrid(grid);
                }
            });
        }
    });
}

// 展开图片网格
function expandImageGrid(grid) {
    grid.classList.add('expanded');
    
    // 重新初始化ViewImage以包含新显示的图片
    if (typeof window.ViewImage !== 'undefined') {
        setTimeout(function() {
            window.ViewImage.init('[view-image] img');
        }, 100);
    }
}

