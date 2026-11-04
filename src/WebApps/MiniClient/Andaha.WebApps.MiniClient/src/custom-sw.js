// Erweitert den Angular Service Worker um das Web Share Target (AC38): Ein geteiltes Bild wird per
// POST /share-target angenommen, im Cache „share-target“ abgelegt und die App per 303 auf die
// Rechnungsliste geleitet (/bill/list?shared=1), die es mit takeSharedImage() abholt.
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

  async function handleShare(request) {
    try {
      var formData = await request.formData();
      var image = formData.get('image');
      if (image && typeof image !== 'string' && image.type && image.type.indexOf('image/') === 0) {
        var cache = await caches.open(CACHE_NAME);
        await cache.put(IMAGE_KEY, new Response(image, { headers: { 'Content-Type': image.type, 'X-File-Name': image.name || 'shared-image' } }));
        return Response.redirect('/bill/list?shared=1', 303);
      }
    } catch (error) {
      console.error('Share target failed', error);
    }
    // ohne (gültiges) Bild einfach in die Liste, ohne Scan
    return Response.redirect('/bill/list', 303);
  }
})();
