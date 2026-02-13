// ===================================
// Service Worker - Offline Support
// ===================================

const CACHE_NAME = 'tour-register-v1.0.0';
const RUNTIME_CACHE = 'tour-register-runtime';

// Files to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './tracking.js',
    './export.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap'
];

// ===================================
// Install Event - Cache Static Assets
// ===================================
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ===================================
// Activate Event - Clean Old Caches
// ===================================
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ===================================
// Fetch Event - Network First Strategy
// ===================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // But cache Google Fonts
        if (url.origin === 'https://fonts.googleapis.com' || 
            url.origin === 'https://fonts.gstatic.com') {
            event.respondWith(cacheFirst(request));
        }
        return;
    }
    
    // Network first for API calls (geocoding)
    if (url.pathname.includes('nominatim.openstreetmap.org')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Cache first for static assets
    if (request.method === 'GET') {
        event.respondWith(cacheFirst(request));
    }
});

// ===================================
// Caching Strategies
// ===================================

// Cache First - Serve from cache, fallback to network
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return cache.match('./index.html');
        }
        
        throw error;
    }
}

// Network First - Try network, fallback to cache
async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        throw error;
    }
}

// ===================================
// Background Sync (for future use)
// ===================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-visits') {
        event.waitUntil(syncVisits());
    }
});

async function syncVisits() {
    // Placeholder for syncing visits to cloud
    console.log('Background sync triggered');
}

// ===================================
// Push Notifications (for future use)
// ===================================
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Tour Register';
    const options = {
        body: data.body || 'You have a notification',
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: data.url || './'
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});

// ===================================
// Message Handler
// ===================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
