import { Capacitor } from "@capacitor/core";

const platform = Capacitor.getPlatform();
export const CAP_IS_WEB = platform === "web";
export const CAP_IS_NATIVE = platform === "ios" || platform === "android";
export const CAP_IS_ANDROID = platform === "android";
export const CAP_IS_IOS = platform === "ios";

export const IS_WEB_ANDROID = CAP_IS_WEB && navigator.userAgent.includes("Android");

export const IS_SERVICE_WORKER_SUPPORTED = CAP_IS_WEB && "serviceWorker" in navigator;

export const PAYWALL_NIP05 = import.meta.env.VITE_PAYWALL_NIP05 as string | undefined;
export const PAYWALL_MESSAGE = import.meta.env.VITE_PAYWALL_MESSAGE as string | undefined;

export const WASM_RELAY_SUPPORTED = "WebAssembly" in self && "Worker" in self && "storage" in navigator;
