import { BehaviorSubject } from "rxjs";
import { registerSW } from "virtual:pwa-register";

import { logger } from "../helpers/debug";

const log = logger.extend("ServiceWorker");

export const serviceWorkerRegistration = new BehaviorSubject<ServiceWorkerRegistration | null>(null);

export async function registerServiceWorker() {
  if (serviceWorkerRegistration.value) return;

  await registerSW({
    immediate: true,
    onRegisteredSW: (s, r) => {
      if (r) serviceWorkerRegistration.next(r);

      if (import.meta.env.DEV) {
        // @ts-expect-error
        window.serviceWorker = r;
      }
    },
    onOfflineReady() {
      log("Offline ready");
    },
    onRegisterError(error) {
      log("Failed to register service worker");
      log(error);
    },
  });
}
