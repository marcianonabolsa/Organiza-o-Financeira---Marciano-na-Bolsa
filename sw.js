const CACHE_NAME = 'marciano-financas-v4';
const STATIC_FILES = ['./', './index.html', './manifest.json'];

// Limpa TODOS os caches antigos imediatamente
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => caches.open(CACHE_NAME).then(c => c.addAll(STATIC_FILES)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  // Força reload em todos os clientes abertos
  self.clients.matchAll({type:'window'}).then(clients => {
    clients.forEach(client => client.navigate(client.url));
  });
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis') || url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status:503})));
    return;
  }
  // Network first — sempre busca versão mais nova
  e.respondWith(
    fetch(e.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return response;
    }).catch(() => caches.match(e.request))
  );
});
