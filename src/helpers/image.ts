import { EMPTY, switchMap } from "rxjs";
import { fixOrientationAndStripMetadata } from "../lib/fix-image-orientation";
import { AppSettingsQuery } from "../models";
import accounts from "../services/accounts";
import { eventStore } from "../services/event-store";
import { type AppSettings } from "./app-settings";

export type ImageSize = { width: number; height: number };
const imageSizeCache = new Map<string, ImageSize>();

export function getImageSize(src: string): Promise<{ width: number; height: number }> {
  const cached = imageSizeCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((res, rej) => {
    const image = new Image();
    image.src = src;

    image.onload = () => {
      const size = { width: image.width, height: image.height };
      imageSizeCache.set(src, size);
      res(size);
    };
    image.onerror = () => rej(new Error("Failed to get image size"));
  });
}

// hack to get app settings
let settings: AppSettings | undefined;
accounts.active$
  .pipe(switchMap((account) => (account ? eventStore.model(AppSettingsQuery, account.pubkey) : EMPTY)))
  .subscribe((v) => (settings = v));

export function buildImageProxyURL(src: string, size: string | number) {
  let url: URL | null = null;
  if (window.IMAGE_PROXY_PATH) {
    url = new URL(location.origin);
    url.pathname = window.IMAGE_PROXY_PATH;
  } else if (settings?.imageProxy) url = new URL(settings.imageProxy);
  if (url === null) return;

  url.pathname = url.pathname.replace(/\/$/, "") + "/" + size + "/" + src;
  return url.toString();
}

export async function stripSensitiveMetadataOnFile(file: File) {
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return (await fixOrientationAndStripMetadata(file)) as File;
  }
  return file;
}
