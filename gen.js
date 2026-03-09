const fs = require('fs');
const p = '/a0/usr/projects/afge_rif_shield_demo/';
const w = (n,c) => { fs.writeFileSync(p+n,c,'utf8'); console.log('✓',n,c.length+'b'); };

// SW
w('sw.js', [
'const CACHE="rif-v2";',
'const ASSETS=["./","./index.html","./manifest.json"];',
'self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));',
'self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));',
'self.addEventListener("fetch",e=>{',
'  if(e.request.method!=="GET")return;',
'  e.respondWith(caches.match(e.request).then(hit=>{',
'    if(hit)return hit;',
'    return fetch(e.request).then(r=>{',
'      if(!r||r.status!==200)return r;',
'      const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return r;',
'    }).catch(()=>caches.match("./index.html"));',
'  }));',
'});'
].join('\n'));

console.log('sw.js done');
