import appSettings from "../services/settings/app-settings";

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

export function buildImageProxyURL(src: string, size: string | number) {
  let url: URL | null = null;
  if (window.IMAGE_PROXY_PATH) {
    url = new URL(location.origin);
    url.pathname = window.IMAGE_PROXY_PATH;
  } else if (appSettings.value.imageProxy) url = new URL(appSettings.value.imageProxy);
  if (url === null) return;

  url.pathname = url.pathname.replace(/\/$/, "") + "/" + size + "/" + src;
  return url.toString();
}
