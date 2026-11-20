// Service worker sederhana: halaman publik diambil dari jaringan lebih dulu.
// Cache hanya dipakai sebagai cadangan saat offline. Aset Next.js (/_next/)
// sengaja tidak di-cache karena nama filenya berubah setiap build.
// Halaman panel (/admin) dan API tidak di-cache demi keamanan data.
const NAMA_CACHE = 'bakery-po-v2';
const HALAMAN_AWAL = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(NAMA_CACHE).then((cache) => cache.addAll(HALAMAN_AWAL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nama) =>
      Promise.all(nama.filter((n) => n !== NAMA_CACHE).map((n) => caches.delete(n))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/')) return; // biarkan browser ambil versi terbaru

  event.respondWith(
    fetch(request)
      .then((respon) => {
        if (respon.ok) {
          const salinan = respon.clone();
          caches.open(NAMA_CACHE).then((cache) => cache.put(request, salinan));
        }
        return respon;
      })
      .catch(() =>
        caches.match(request).then((tersimpan) => tersimpan || caches.match('/')),
      ),
  );
});
