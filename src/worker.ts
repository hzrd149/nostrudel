//  / <reference no-default-lib="true"/>
/// <reference lib="ES2022" />
/// <reference lib="DOM" />
/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare var self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
});

// caching
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

let allowlist: undefined | RegExp[] = undefined;
if (import.meta.env.DEV) allowlist = [/^\/$/];
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist }));

// notifications
import { type WebPushNotification } from "@satellite-earth/core/types/control-api/notifications.js";

self.addEventListener("push", (event) => {
  const data = event.data?.json() as WebPushNotification | undefined;

  if (!data) return;

  try {
    event.waitUntil(self.registration.showNotification(data.title, { body: data.body, data, icon: data.icon }));
  } catch (error) {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data: WebPushNotification = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      const firstClient = clientList[0];
      if (firstClient) {
        firstClient.focus();
        firstClient.navigate(data.url);
      } else {
        self.clients.openWindow(data.url).then((window) => window?.focus());
      }
    }),
  );
});
