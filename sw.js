// Service worker: tiene in cache solo l'app (i dati arrivano sempre dal server) e mostra le notifiche
importScripts('config.js');
var CACHE = 'pds-v8';
var FILES = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'comuni.json'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== CACHE; }).map(function (x) { return caches.delete(x); })); }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;   // API e font: rete
  // rete prima, cache se offline: così gli aggiornamenti arrivano subito
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (r) {
    var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); return r;
  }).catch(function () { return caches.match(e.request); }));
});

// ---- notifiche (Firebase Cloud Messaging: messaggi "data") ----
function chiamaApi(o) {
  return fetch(self.PDS_CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(o) })
    .then(function (r) { return r.json(); });
}
self.addEventListener('push', function (e) {
  var d = {};
  try { var j = e.data ? e.data.json() : {}; d = j.data || j; } catch (x) { d = { testo: e.data ? e.data.text() : '' }; }
  var azioni = [];
  try { azioni = JSON.parse(d.azioni || '[]'); } catch (x) {}
  var tag = d.riga ? 'av' + d.riga : (d.numero ? 'fp' + d.numero + (d.id || '') : 'pds' + Date.now());
  var lavori = [self.registration.showNotification(d.titolo || 'Programma di Servizio', {
    body: d.testo || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: tag, renotify: true,
    requireInteraction: azioni.length > 0, actions: azioni, data: d, lang: 'it' })];
  // numero sull'icona dell'app e aggiornamento dei pallini se l'app è aperta
  if (d.n !== undefined && self.navigator && self.navigator.setAppBadge) lavori.push((Number(d.n) ? self.navigator.setAppBadge(Number(d.n)) : self.navigator.clearAppBadge()).catch(function () {}));
  lavori.push(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) { l.forEach(function (c) { c.postMessage({ tipo: 'push' }); }); }));
  // conferma di consegna al server (colonna "Arrivata")
  if (d.riga && d.firma) lavori.push(chiamaApi({ azione: 'pushAzione', az: 'ric', riga: d.riga, u: d.u, firma: d.firma }).catch(function () {}));
  e.waitUntil(Promise.all(lavori));
});
function apriApp(link) {
  var url = self.registration.scope + (link || '');
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (c.url.indexOf(self.registration.scope) === 0) {
        return (c.navigate ? c.navigate(url).catch(function () { return c; }) : Promise.resolve(c)).then(function (cc) { return (cc || c).focus(); });
      }
    }
    return self.clients.openWindow(url);
  });
}
self.addEventListener('notificationclick', function (e) {
  var d = e.notification.data || {}, az = e.action;
  e.notification.close();
  if (az === 'an') { e.waitUntil(apriApp('#notifiche')); return; }   // Annullata/rinviata: serve il motivo, si apre l'app
  if (az) {   // tasto premuto nella notifica (Android): Accetto / Assente / Approva / Rifiuta
    e.waitUntil(chiamaApi({ azione: 'pushAzione', az: az, u: d.u, firma: d.firma, riga: d.riga, numero: d.numero, id: d.id }).then(function (j) {
      return self.registration.showNotification(j.ok ? '✔ Fatto' : '⚠️ Non riuscito', {
        body: j.ok ? ((j.dati && j.dati.messaggio) || '') : (j.errore || 'Errore') + ' – Tocca per aprire l\'app.', icon: 'icon-192.png', tag: 'esito', data: { link: d.link } });
    }).catch(function () { return apriApp(d.link); }));
    return;
  }
  e.waitUntil(apriApp(d.link));
});
