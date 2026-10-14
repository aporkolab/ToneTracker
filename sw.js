/**
 * @fileoverview Service Worker for ToneTracker PWA
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'tonetracker-v2.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;
const API_CACHE_NAME = `${CACHE_NAME}-api`;

// Files to cache immediately (App Shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/css/_accessibility.css',
  '/src/js/main.js',
  '/src/js/colorUtils.js',
  '/src/js/errorHandler.js',
  '/src/js/stateManager.js',
  '/src/js/storage.js',
  '/src/js/analytics.js',
  '/src/js/performance.js',
  '/src/js/i18n.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/manifest.json'
];

// Dynamic content patterns
const DYNAMIC_PATTERNS = [
  /\/assets\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
  /\/fonts\/.*\.(woff|woff2|ttf|eot)$/,
  /\.js$/,
  /\.css$/
];

// API endpoints to cache
const API_PATTERNS = [
  /\/api\/.*/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/analytics/,
  /\/api\/user-preferences/
];

/**
 * Service Worker installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event handler - main caching logic
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different request types
  if (isStaticFile(request)) {
    event.respondWith(handleStaticFile(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isDynamicFile(request)) {
    event.respondWith(handleDynamicFile(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Background sync for analytics data
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  } else if (event.tag === 'user-preferences-sync') {
    event.waitUntil(syncUserPreferences());
  }
});

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'ToneTracker notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ToneTracker', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats });
    });
  } else if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  } else if (event.data.type === 'PRECACHE_RESOURCES') {
    precacheResources(event.data.resources).then(() => {
      event.ports[0].postMessage({ type: 'PRECACHE_COMPLETE' });
    });
  }
});

/**
 * Handle static file requests (App Shell)
 * Strategy: Cache First
 */
async function handleStaticFile(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📋 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Fetching static file:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Error serving static file:', error);
    return await getFallbackResponse(request);
  }
}

/**
 * Handle API requests
 * Strategy: Network First with fallback to cache
 */
async function handleApiRequest(request) {
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(request.url));
  
  if (isNetworkFirst) {
    return handleNetworkFirst(request, API_CACHE_NAME);
  } else {
    return handleCacheFirst(request, API_CACHE_NAME);
  }
}

/**
 * Handle dynamic file requests
 * Strategy: Stale While Revalidate
 */
async function handleDynamicFile(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Serve from cache immediately
    const fetchPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || await fetchPromise;
  } catch (error) {
    console.error('❌ Error serving dynamic file:', error);
    return await getFallbackResponse(request);
  }
}

/**
 * Handle generic requests
 */
async function handleGenericRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('❌ Error serving generic request:', error);
    return await getFallbackResponse(request);
  }
}

/**
 * Network First strategy
 */
async function handleNetworkFirst(request, cacheName) {
  try {
    console.log('🌐 Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && cacheName) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📋 Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return await getFallbackResponse(request);
  }
}

/**
 * Cache First strategy
 */
async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📋 Cache first hit:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first error:', error);
    return await getFallbackResponse(request);
  }
}

/**
 * Get fallback response for failed requests
 */
async function getFallbackResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/index.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
  
  // Return offline indicator for images
  if (request.destination === 'image') {
    return new Response('', { status: 503 });
  }
  
  // Return empty response for other requests
  return new Response('', { status: 503 });
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('🗑️ Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    });
  
  return Promise.all(deletePromises);
}

/**
 * Sync analytics data in background
 */
async function syncAnalyticsData() {
  try {
    console.log('📊 Syncing analytics data...');
    
    // This would typically read from IndexedDB and sync with server
    // For now, we'll just log the action
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ANALYTICS_SYNC_REQUEST',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Analytics sync failed:', error);
    throw error;
  }
}

/**
 * Sync user preferences
 */
async function syncUserPreferences() {
  try {
    console.log('⚙️ Syncing user preferences...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PREFERENCES_SYNC_REQUEST',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Preferences sync failed:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      entryCount: keys.length,
      entries: keys.map(request => request.url)
    };
  }
  
  return stats;
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map(name => caches.delete(name));
  return Promise.all(deletePromises);
}

/**
 * Precache additional resources
 */
async function precacheResources(resources) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  return cache.addAll(resources);
}

/**
 * Utility functions for request classification
 */
function isStaticFile(request) {
  const url = new URL(request.url);
  return STATIC_FILES.some(file => url.pathname === file || url.pathname.endsWith(file));
}

function isDynamicFile(request) {
  const url = new URL(request.url);
  return DYNAMIC_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Performance monitoring in Service Worker
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0
};

// Log performance metrics periodically
setInterval(() => {
  console.log('📊 SW Performance Metrics:', performanceMetrics);
  
  // Reset metrics (keep last hour data)
  performanceMetrics = {
    cacheHits: Math.floor(performanceMetrics.cacheHits * 0.1),
    cacheMisses: Math.floor(performanceMetrics.cacheMisses * 0.1),
    networkRequests: Math.floor(performanceMetrics.networkRequests * 0.1),
    backgroundSyncs: Math.floor(performanceMetrics.backgroundSyncs * 0.1)
  };
}, 3600000); // Every hour
