const CACHE_NAME = 'marciano-financas-v2';
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Instala e cacheia os arquivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first para APIs do Supabase, cache first para assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase e CDNs — sempre busca da rede
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis') || url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Arquivos locais — cache first, fallback para rede
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return response;
    }))
  );
});
