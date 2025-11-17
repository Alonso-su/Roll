const CACHE_NAME = 'suus-blog-v1';
const STATIC_CACHE = 'suus-static-v1';
const DYNAMIC_CACHE = 'suus-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/favicon.svg',
  // 其他资源会在运行时动态添加
];

// 需要缓存的资源类型
const CACHEABLE_EXTENSIONS = [
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        // Failed to cache static assets
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 删除旧版本的缓存
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 对于导航请求（页面请求）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 如果网络请求成功，缓存响应并返回
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时，尝试从缓存中获取
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // 如果缓存中也没有，返回离线页面
              return caches.match('/offline/');
            });
        })
    );
    return;
  }
  
  // 对于静态资源请求
  if (isCacheableResource(request.url)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 从缓存返回，同时在后台更新缓存
            fetch(request)
              .then(response => {
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(STATIC_CACHE)
                    .then(cache => {
                      cache.put(request, responseClone);
                    });
                }
              })
              .catch(() => {
                // 网络请求失败，忽略
              });
            
            return cachedResponse;
          }
          
          // 缓存中没有，从网络获取
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }
  
  // 对于API请求，优先使用网络
  if (request.url.includes('/api/') || request.url.includes('suuus.top')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // API请求成功，可以选择性缓存
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // API请求失败，尝试从缓存获取
          return caches.match(request);
        })
    );
    return;
  }
});

// 判断是否为可缓存的资源
function isCacheableResource(url) {
  return CACHEABLE_EXTENSIONS.some(ext => url.includes(ext));
}

// 处理消息事件
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 后台同步事件（如果支持）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    // 这里可以处理离线时的数据同步
  }
});

// 推送通知事件（如果需要）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});