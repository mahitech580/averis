const CACHE='averis-by-mahi-v6';
const CORE=['./','./index.html','./styles.css?v=6','./app.js?v=6','./manifest.json','./assets/averis-orbit.svg','./assets/care-network.svg','./assets/operational-pulse.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const dynamic=/\.(js|css|html)$/.test(url.pathname);
  if(dynamic){
    e.respondWith(fetch(e.request).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return r;
  }).catch(()=>cached)));
});