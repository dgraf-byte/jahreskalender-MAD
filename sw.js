'use strict';

self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: 'Maderegger Firmenkalender',
      body: event.data ? event.data.text() : 'Neuer Termin'
    };
  }

  const title =
    data.title || 'Maderegger Firmenkalender';

  const options = {
    body: data.body || 'Ein neuer Termin wurde eingetragen.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'maderegger-calendar',
    renotify: true,
    data: {
      url: data.url || './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {

      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});