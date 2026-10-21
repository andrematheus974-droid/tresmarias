const CACHE_NAME = 'central-da-casa-v6-20261020';
const APP_SHELL = ['./','./index.html','./instalar.html','./manifest.webmanifest',
  './icons/favicon-64.png','./icons/apple-touch-icon.png','./icons/icon-192.png',
  './icons/icon-512.png','./icons/icon-maskable-192.png','./icons/icon-maskable-512.png'];
const APP_URLS = new Set(APP_SHELL.map(path => new URL(path,self.location.href).href));
self.addEventListener('install',event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
    APP_SHELL.map(path => new Request(path,{cache:'reload'}))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate',event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key !== CACHE_NAME && (key.startsWith('central-da-casa-') || key.startsWith('controle-da-casa-'))
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch',event => {
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(async response => {
      if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone())}
      return response;
    }).catch(async () => {
      const cache=await caches.open(CACHE_NAME);
      return (await cache.match(request)) || (await cache.match(
        url.pathname.endsWith('instalar.html')?'./instalar.html':'./index.html'
      ));
    }));return;
  }
  if(!APP_URLS.has(url.href))return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached=await cache.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }));
});
