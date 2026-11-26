const V='egx-__V__';
const FILES=['./','index.html','app.js','app.css','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'reload'}).then(r=>r.ok&&c.put(f,r)).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isStatic=u=>/\.(js|css|woff2?|png|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
const isData=u=>/\.json$/.test(u.pathname)||u.hostname!==location.hostname;
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;const u=new URL(q.url);
const fonts=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
if(u.hostname!==location.hostname&&!fonts)return;
if(u.pathname.endsWith('sw.js'))return;
if(isStatic(u)&&!/\.json$/.test(u.pathname)){
 // stale-while-revalidate: serve cache now, refresh in background
 e.respondWith(caches.open(V).then(c=>c.match(q,{ignoreSearch:false}).then(hit=>{
  const net=fetch(q,{cache:'no-store'}).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(q,r.clone());return r}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return net.then(r=>r||c.match('./')||Response.error())})));
 return}
// data (json): network first, cache fallback offline
e.respondWith(fetch(q,{cache:'no-store'}).then(r=>{const c=r.clone();if(r.ok)caches.open(V).then(x=>x.put(q,c));return r}).catch(()=>caches.match(q).then(r=>r||caches.match('./'))))});
