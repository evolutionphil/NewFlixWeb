// Service Worker for Flix IPTV - Progressive Web App Support
const CACHE_NAME = 'flix-iptv-v1.2';
const STATIC_CACHE = 'flix-static-v1.2';
const DYNAMIC_CACHE = 'flix-dynamic-v1.2';

// Critical resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/home',
    '/offline.html',
    '/images/logo.png',
    '/frontend/style.css',
    '/admin/template/css/bootstrap.min.css',
    '/admin/template/vendor/jquery/jquery.js',
    '/admin/template/vendor/bootstrap/bootstrap.js',
    '/admin/template/fonts/font-awesome/font-awesome.css'
];

// Pages to cache dynamically
const CACHE_PAGES = [
    '/news',
    '/faq',
    '/contact',
    '/activation',
    '/mylist',
    '/instructions'
];

// Install Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static assets:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Cache cleanup complete');
            return self.clients.claim();
        })
    );
});

// Fetch Strategy - Network First with Cache Fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip admin and API routes
    if (url.pathname.startsWith('/admin/') || 
        url.pathname.startsWith('/api/') || 
        url.pathname.startsWith('/reseller/')) {
        return;
    }
    
    // Handle static assets (images, CSS, JS)
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // Handle HTML pages
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Default: Network first
    event.respondWith(networkFirstStrategy(request));
});

// Cache First Strategy (for static assets)
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('Service Worker: Cached static asset:', request.url);
        }
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Cache first strategy failed:', error);
        return caches.match('/offline.html');
    }
}

// Network First Strategy (for HTML pages)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('Service Worker: Cached dynamic content:', request.url);
        }
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        // Return basic offline response for other requests
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background Sync for improved offline experience
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'playlist-upload') {
        event.waitUntil(syncPlaylistData());
    }
});

// Sync playlist data when connection is restored
async function syncPlaylistData() {
    try {
        // Handle offline playlist uploads when connection is restored
        const offlineData = await getStoredOfflineData();
        if (offlineData && offlineData.length > 0) {
            for (const data of offlineData) {
                await fetch('/savePlaylists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            await clearStoredOfflineData();
            console.log('Service Worker: Offline data synchronized');
        }
    } catch (error) {
        console.error('Service Worker: Sync failed:', error);
    }
}

// Helper functions for offline data management
async function getStoredOfflineData() {
    return new Promise(resolve => {
        // Implementation would depend on your offline storage strategy
        resolve([]);
    });
}

async function clearStoredOfflineData() {
    // Clear stored offline data after successful sync
    console.log('Service Worker: Offline data cleared');
}

// Push notification support for updates
self.addEventListener('push', event => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/images/logo.png',
            badge: '/images/logo.png',
            data: {
                url: '/news'
            }
        };
        
        event.waitUntil(
            self.registration.showNotification('Flix IPTV Update', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.openWindow(event.notification.data.url || '/')
    );
});

// Cache management - Cleanup old caches periodically
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(updateCaches());
    }
});

async function updateCaches() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log('Service Worker: Caches updated successfully');
    } catch (error) {
        console.error('Service Worker: Cache update failed:', error);
    }
}

console.log('Service Worker: Flix IPTV PWA Service Worker loaded successfully');