self.addEventListener('push', event => {
  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch (error) {
    data = {
      body: event.data
        ? event.data.text()
        : ''
    };
  }

  const title =
    data.title ||
    'MAD-Kalender';

  const options = {
    body:
      data.body ||
      'Neuer Termin im Firmenkalender',

    data: {
      url:
        data.url ||
        './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


self.addEventListener(
  'notificationclick',
  event => {
    event.notification.close();

    const url =
      event.notification.data?.url ||
      './';

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(windowClients => {

        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
);
