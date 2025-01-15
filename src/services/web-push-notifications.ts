import { type WebPushChannel } from "@satellite-earth/core/types/control-api/notifications.js";
import { nanoid } from "nanoid";

import { getControlApi } from "./bakery";
import { BehaviorSubject } from "rxjs";
import { serviceWorkerRegistration } from "./worker";
import localSettings from "./local-settings";

export const pushSubscription = new BehaviorSubject<PushSubscription | null>(null);
serviceWorkerRegistration.subscribe(async (registration) => {
  if (registration) {
    pushSubscription.next(await registration.pushManager.getSubscription());
  }
});

export async function enableNotifications() {
  const controlApi = getControlApi();

  if (!controlApi) throw new Error("Missing control api");
  const subscription = await serviceWorkerRegistration.value?.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: controlApi.vapidKey.value,
  });

  if (subscription) {
    const json = subscription.toJSON();
    const { endpoint } = json;
    if (!endpoint) throw new Error("Missing endpoint");

    // @ts-expect-error
    const isMobile: boolean = navigator.userAgentData?.mobile ?? navigator.userAgent.includes("Android");
    const metadata: WebPushChannel = {
      id: `web:${nanoid()}`,
      type: "web",
      device: localSettings.deviceId.value,
      endpoint: endpoint!,
      expirationTime: subscription.expirationTime,
      keys: json.keys as WebPushChannel["keys"],
    };

    controlApi.send(["CONTROL", "NOTIFICATIONS", "REGISTER", metadata]);
    pushSubscription.next(subscription);
  } else throw new Error("Failed to register subscription");
}

export async function disableNotifications() {
  const controlApi = getControlApi();

  if (pushSubscription.value) {
    const key = pushSubscription.value.toJSON().keys?.p256dh;
    if (key) controlApi?.send(["CONTROL", "NOTIFICATIONS", "UNREGISTER", key]);

    await pushSubscription.value.unsubscribe();
  }
}
