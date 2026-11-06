// Erweitert den Angular Service Worker um das Web Share Target (AC38): Geteilte Bilder (eins oder mehrere)
// werden per POST /share-target angenommen, fortlaufend (/shared-image/0, /1, …) im Cache „share-target“
// abgelegt und die App per 303 auf die Rechnungsliste geleitet (/bill/list?shared=1), die sie mit
// takeSharedImages() abholt; ohne brauchbares Bild auf /bill/list?shared=0 (Hinweis in der Liste).
importScripts('./ngsw-worker.js');

(function () {
  'use strict';

  var CACHE_NAME = 'share-target';
  var IMAGE_KEY = '/shared-image';

  self.addEventListener('fetch', function (event) {
    var request = event.request;
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/share-target') {
      return;
    }
    event.respondWith(handleShare(request));
  });

  // Bild: image/*; manche Android-Apps teilen ohne oder mit generischem MIME-Typ. Ob es wirklich ein
  // Bild ist, prüft die Analyse-Vorbereitung (nicht dekodierbar → Upload-Fehler).
  function isImageCandidate(file) {
    if (!file || typeof file === 'string' || !file.size) {
      return false;
    }
    var type = file.type || '';
    return type === '' || type === 'application/octet-stream' || type.indexOf('image/') === 0;
  }

  async function handleShare(request) {
    try {
      var formData = await request.formData();
      var images = formData.getAll('image').filter(isImageCandidate);
      if (images.length > 0) {
        var cache = await caches.open(CACHE_NAME);
        for (var i = 0; i < images.length; i++) {
          var image = images[i];
          // Header-Werte nur Latin-1: Dateiname kodiert (takeSharedImages dekodiert ihn)
          var headers = { 'X-File-Name': encodeURIComponent(image.name || 'shared-image') };
          if (image.type) {
            headers['Content-Type'] = image.type;
          }
          await cache.put(IMAGE_KEY + '/' + i, new Response(image, { headers: headers }));
        }
        return Response.redirect('/bill/list?shared=1', 303);
      }
    } catch (error) {
      console.error('Share target failed', error);
    }
    // kein brauchbares Bild: die Liste meldet das (shared=0), statt es still zu verwerfen
    return Response.redirect('/bill/list?shared=0', 303);
  }
})();
