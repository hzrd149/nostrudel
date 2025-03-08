import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();
export const CAP_IS_WEB = platform === "web";
export const CAP_IS_NATIVE = platform === "ios" || platform === "android";
export const CAP_IS_ANDROID = platform === "android";
export const CAP_IS_IOS = platform === "ios";

export const PAYWALL_NIP05 = import.meta.env.VITE_PAYWALL_NIP05 as string | undefined;
export const PAYWALL_MESSAGE = import.meta.env.VITE_PAYWALL_MESSAGE as string | undefined;
