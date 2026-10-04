const CACHE="averis-nexus-20261004-v1";
const ASSETS=["./","./index.html","./styles.css?v=20261004","./app.js?v=20261004","./manifest.json?v=20261004","./assets/averis-mark.svg","./assets/nexus-bg.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>caches.match("./index.html"))));
});