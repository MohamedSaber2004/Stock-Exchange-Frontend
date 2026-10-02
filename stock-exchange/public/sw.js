// Silent Service Worker - Prevents DevTools from logging HTTP 4xx/5xx network errors
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // Only intercept API calls
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // If server returned an HTTP error code (>= 400), wrap as 200 OK
          // so Chrome DevTools never logs red network error in console
          if (response.status >= 400) {
            const headers = new Headers(response.headers)
            headers.set('x-original-status', response.status.toString())
            const body = await response.blob()
            return new Response(body, {
              status: 200,
              statusText: 'OK',
              headers: headers,
            })
          }
          return response
        })
        .catch(() => {
          // On network failure, also return 200 with error JSON so DevTools never logs net::ERR_FAILED
          return new Response(
            JSON.stringify({
              success: false,
              statusCode: 503,
              message: 'Network error or server unreachable',
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'x-original-status': '503',
              },
            }
          )
        })
    )
  }
})
