// Brutal Reminder service worker
// Handles inbound push events, notification taps, and subscription renewal.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: "Brutal Reminder", body: event.data.text() };
  }

  const title = payload.title || "Brutal Reminder";
  const body = payload.body || "Your check-in is ready.";
  const url = payload.url || "/brutal-reminder";
  const tag = payload.tag || "brutal-reminder";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/brutal-reminder-icon.svg",
      badge: "/icons/brutal-reminder-icon.svg",
      data: { url, reminderId: payload.reminderId || null },
      requireInteraction: false,
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/brutal-reminder";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          } catch (error) {
            // ignore navigation failure and try opening a new window below
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch("/api/brutal-reminder/vapid-public-key");
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const publicKey = data.publicKey;
        if (!publicKey) {
          return;
        }
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await fetch("/api/brutal-reminder/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: newSubscription.toJSON().keys,
          }),
        });
      } catch (error) {
        // Silent failure: the server will mark this subscription as revoked if pushes fail
      }
    })(),
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
