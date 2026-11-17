/* MG STORE service worker v10 - sûr: pas de réponse redirigée, repli hors-ligne */
var CACHE='mgstore-v10';
var SHELL=['./icon-192.png','./icon-512.png','./icon-maskable-512.png','./admin-icon-192.png','./admin-icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function clean(r){
  /* une réponse "redirected" ne peut pas servir une navigation: on la recopie */
  if(r&&r.redirected){return r.blob().then(function(b){return new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers})})}
  return r;
}
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(clean).then(function(r){
        if(r&&r.ok&&url.origin===location.origin){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)}).catch(function(){})}
        return r;
      }).catch(function(){
        return caches.match(req,{ignoreSearch:true}).then(function(m){
          return m||new Response('<meta name=viewport content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>MG STORE</h2><p>Pas de connexion internet.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
        });
      })
    );
    return;
  }
  if(url.origin===location.origin&&/\.(png|jpg|svg|ico)$/.test(url.pathname)){
    e.respondWith(caches.match(req).then(function(m){return m||fetch(req).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)}).catch(function(){});return r})}));
  }
});
self.addEventListener('push',function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){try{d={body:e.data.text()}}catch(y){}}
  e.waitUntil(self.registration.showNotification(d.title||'MG STORE',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var u=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){
    for(var i=0;i<l.length;i++){if('focus' in l[i])return l[i].focus()}
    return clients.openWindow(u);
  }));
});
