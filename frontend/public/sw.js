// Chess Dojo PWA Service Worker - Complete Offline Support

const CACHE_VERSION = "v4";
const CACHE_NAMES = {
  static: `chessdojo-static-${CACHE_VERSION}`,
  pages: `chessdojo-pages-${CACHE_VERSION}`,
  api: `chessdojo-api-${CACHE_VERSION}`,
  images: `chessdojo-images-${CACHE_VERSION}`
};

const offlineFallbackPage = "/offline.html";

// ALL pages to cache for complete offline experience
const ESSENTIAL_PAGES = [
  '/',
  '/newsfeed',
  '/profile',
  '/scoreboard',
  '/scoreboard/dojo',
  '/scoreboard/following',
  '/scoreboard/search',
  '/scoreboard/stats',
  '/calendar',
  '/games',
  '/games/import',
  '/games/analysis',
  '/courses',
  '/material',
  '/material/books',
  '/material/sparring',
  '/material/modelgames',
  '/material/memorizegames',
  '/material/ratings',
  '/material/bots',
  '/clubs',
  '/tournaments',
  '/tournaments/round-robin',
  '/tournaments/open-classical',
  '/tournaments/liga',
  '/help',
  '/coaching',
  '/tests',
  '/donate',
  '/blog',
  '/prices',
  '/signin',
  '/signup'
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  console.log('[SW] Installing comprehensive service worker...');
  self.skipWaiting(); // Force immediate activation
  
  event.waitUntil(
    Promise.all([
      // Cache offline fallback
      caches.open(CACHE_NAMES.static).then(cache => {
        return cache.add(offlineFallbackPage).catch(err => {
          console.warn('[SW] Failed to cache offline page:', err);
        });
      }),
      
      // Cache essential pages
      caches.open(CACHE_NAMES.pages).then(cache => {
        console.log('[SW] Pre-caching essential pages...');
        return Promise.allSettled(
          ESSENTIAL_PAGES.map(page => 
            cache.add(page).then(() => {
              console.log(`[SW] Pre-cached: ${page}`);
            }).catch(err => {
              console.warn(`[SW] Failed to pre-cache: ${page}`, err);
            })
          )
        );
      })
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating comprehensive service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName.startsWith('chessdojo-') && 
              !Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated and ready');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle navigation requests (page loads) - CACHE EVERYTHING
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request));
  }
  
  // Handle API requests - CACHE ALL RESPONSES
  else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(event.request));
  }
  
  // Handle static assets (JS, CSS, fonts, etc.)
  else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(event.request));
  }
  
  // Handle images
  else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(event.request));
  }
  
  // Handle everything else - CACHE ALL
  else {
    event.respondWith(handleGenericRequest(event.request));
  }
});

// Navigation handler - Cache first for instant offline access
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAMES.pages);
  
  try {
    // Try network first
    const networkResp = await fetch(request);
    
    if (networkResp.ok) {
      // Cache the response
      cache.put(request, networkResp.clone()).catch(err => {
        console.warn('[SW] Failed to cache page:', err);
      });
      console.log('[SW] Cached page:', request.url);
    }
    
    return networkResp;
  } catch (error) {
    console.log('[SW] Network failed for page, serving from cache:', request.url);
    
    // Serve from cache
    const cachedResp = await cache.match(request);
    if (cachedResp) {
      console.log('[SW] Serving page from cache:', request.url);
      return cachedResp;
    }
    
    // Try to serve homepage as fallback
    const homepageResp = await cache.match('/');
    if (homepageResp) {
      console.log('[SW] Serving homepage fallback');
      return homepageResp;
    }
    
    // Last resort - offline page
    const staticCache = await caches.open(CACHE_NAMES.static);
    const offlineResp = await staticCache.match(offlineFallbackPage);
    return offlineResp || new Response('Page not available offline', { status: 503 });
  }
}

// API handler - Cache ALL API responses aggressively
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAMES.api);
  
  try {
    // Try network first
    const networkResp = await fetch(request);
    
    // Cache ALL successful responses (GET, POST, PUT, DELETE, etc.)
    if (networkResp.ok) {
      // Create a cache key that includes query parameters
      const cacheKey = new Request(request.url, {
        method: 'GET', // Normalize to GET for caching
        headers: request.headers
      });
      
      cache.put(cacheKey, networkResp.clone()).catch(err => {
        console.warn('[SW] Failed to cache API:', err);
      });
      console.log('[SW] Cached API response:', request.url);
    }
    
    return networkResp;
  } catch (error) {
    console.log('[SW] API failed, serving from cache:', request.url);
    
    // Try to find cached response with normalized key
    const cacheKey = new Request(request.url, {
      method: 'GET',
      headers: request.headers
    });
    
    const cachedResp = await cache.match(cacheKey);
    if (cachedResp) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResp;
    }
    
    // Also try original request
    const originalCached = await cache.match(request);
    if (originalCached) {
      console.log('[SW] Serving API from cache (original):', request.url);
      return originalCached;
    }
    
    // Return appropriate empty response based on endpoint
    return createOfflineApiResponse(request.url);
  }
}

// Static assets handler
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  
  // Try cache first for static assets
  const cachedResp = await cache.match(request);
  if (cachedResp) {
    return cachedResp;
  }
  
  try {
    const networkResp = await fetch(request);
    if (networkResp.ok) {
      cache.put(request, networkResp.clone());
    }
    return networkResp;
  } catch (error) {
    return new Response('Static asset not available offline', { status: 503 });
  }
}

// Image handler
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  
  // Try cache first
  const cachedResp = await cache.match(request);
  if (cachedResp) {
    return cachedResp;
  }
  
  try {
    const networkResp = await fetch(request);
    if (networkResp.ok) {
      cache.put(request, networkResp.clone());
    }
    return networkResp;
  } catch (error) {
    // Return transparent 1x1 pixel for missing images
    return new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 120, 218, 99, 248, 15, 0, 1, 1, 1, 0, 24, 221, 141, 176, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]), {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  }
}

// Generic request handler - Cache everything
async function handleGenericRequest(request) {
  const cache = await caches.open(CACHE_NAMES.pages);
  
  try {
    const networkResp = await fetch(request);
    if (networkResp.ok) {
      cache.put(request, networkResp.clone()).catch(err => {
        console.warn('[SW] Failed to cache generic request:', err);
      });
    }
    return networkResp;
  } catch (error) {
    const cachedResp = await cache.match(request);
    return cachedResp || new Response('Content not available offline', { status: 503 });
  }
}

// Helper functions
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('chessdojo') ||
         url.pathname.includes('/calendar') ||
         url.pathname.includes('/notifications') ||
         url.pathname.includes('/events') ||
         url.pathname.includes('/games') ||
         url.pathname.includes('/profile') ||
         url.pathname.includes('/scoreboard') ||
         url.pathname.includes('/courses') ||
         url.pathname.includes('/material') ||
         url.pathname.includes('/clubs') ||
         url.pathname.includes('/tournaments') ||
         url.pathname.includes('/requirements') ||
         url.pathname.includes('/users') ||
         url.pathname.includes('/payments') ||
         url.pathname.includes('/exams') ||
         url.pathname.includes('/graduations') ||
         url.pathname.includes('/newsfeed') ||
         url.pathname.includes('/directories') ||
         url.pathname.includes('/emails') ||
         url.pathname.includes('/year-reviews') ||
         url.pathname.includes('/coach') ||
         url.pathname.includes('/chatbot') ||
         url.pathname.includes('/explorer') ||
         url.pathname.includes('/round-robin') ||
         url.pathname.includes('/directory') ||
         // Catch any request that looks like an API call
         (url.pathname.includes('/') && (
           url.search.includes('cohort=') ||
           url.search.includes('username=') ||
           url.search.includes('id=') ||
           url.search.includes('type=') ||
           url.search.includes('page=') ||
           url.search.includes('limit=') ||
           url.search.includes('offset=')
         ));
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/') || 
         url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('.woff') ||
         url.pathname.includes('.woff2') ||
         url.pathname.includes('.ttf') ||
         url.pathname.includes('.otf') ||
         url.pathname.includes('.eot') ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico' ||
         url.pathname.startsWith('/static/');
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function createOfflineApiResponse(requestUrl) {
  const url = new URL(requestUrl);
  let offlineData = { error: 'Offline', message: 'API not available offline' };
  
  // Create appropriate responses based on endpoint
  if (url.pathname.includes('/events') || url.pathname.includes('/calendar')) {
    offlineData = { events: [], lastEvaluatedKey: null };
  } else if (url.pathname.includes('/notifications')) {
    offlineData = { notifications: [], lastEvaluatedKey: null };
  } else if (url.pathname.includes('/games')) {
    offlineData = { games: [], lastEvaluatedKey: null };
  } else if (url.pathname.includes('/profile') || url.pathname.includes('/user')) {
    offlineData = { user: null, error: 'Profile not available offline' };
  } else if (url.pathname.includes('/scoreboard')) {
    offlineData = { scoreboard: [], users: [] };
  } else if (url.pathname.includes('/courses')) {
    offlineData = { courses: [], data: [] };
  } else if (url.pathname.includes('/requirements')) {
    offlineData = { requirements: [], data: [] };
  } else if (url.pathname.includes('/tournaments')) {
    offlineData = { tournaments: [], data: [] };
  } else if (url.pathname.includes('/clubs')) {
    offlineData = { clubs: [], data: [] };
  } else if (url.pathname.includes('/payments')) {
    offlineData = { payments: [], data: [] };
  } else if (url.pathname.includes('/exams')) {
    offlineData = { exams: [], data: [] };
  } else if (url.pathname.includes('/graduations')) {
    offlineData = { graduations: [], data: [] };
  } else if (url.pathname.includes('/newsfeed')) {
    offlineData = { posts: [], data: [] };
  } else if (url.pathname.includes('/directories')) {
    offlineData = { directories: [], data: [] };
  } else if (url.pathname.includes('/emails')) {
    offlineData = { emails: [], data: [] };
  } else if (url.pathname.includes('/year-reviews')) {
    offlineData = { reviews: [], data: [] };
  } else if (url.pathname.includes('/coach')) {
    offlineData = { coaches: [], data: [] };
  } else if (url.pathname.includes('/chatbot')) {
    offlineData = { messages: [], data: [] };
  } else if (url.pathname.includes('/explorer')) {
    offlineData = { positions: [], data: [] };
  } else if (url.pathname.includes('/round-robin')) {
    offlineData = { rounds: [], data: [] };
  } else {
    offlineData = { data: [], items: [], results: [] };
  }
  
  console.log('[SW] Returning offline API response for:', requestUrl);
  return new Response(JSON.stringify(offlineData), {
    status: 200, // Return 200 to prevent app errors
    headers: { 
      'Content-Type': 'application/json',
      'X-Served-By': 'service-worker-offline'
    }
  });
}

console.log('[SW] Service worker loaded and ready');
