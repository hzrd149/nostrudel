import { NostrEvent } from "nostr-tools";

export const FILE_KIND = 1063;
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
export const AUDIO_TYPES = ["audio/webm", "audio/wav", "audio/ogg"];
export const TEXT_TYPES = ["text/plain"];

export type ParsedImageFile = {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  size?: number;
  magnet?: string;
  sha256Hash?: string;
  infoHash?: string;
  blurhash?: string;
};

export function getFileUrl(event: NostrEvent) {
  const url = event.tags.find((t) => t[0] === "url" && t[1])?.[1];
  if (!url) throw new Error("Missing url");
  return url;
}

export function parseImageFile(event: NostrEvent): ParsedImageFile {
  const url = getFileUrl(event);
  const mimeType = event.tags.find((t) => t[0] === "m" && t[1])?.[1];
  const magnet = event.tags.find((t) => t[0] === "magnet" && t[1])?.[1];
  const infoHash = event.tags.find((t) => t[0] === "i" && t[1])?.[1];
  const size = event.tags.find((t) => t[0] === "i" && t[1])?.[1];
  const sha256Hash = event.tags.find((t) => t[0] === "x" && t[1])?.[1];
  const blurhash = event.tags.find((t) => t[0] === "blurhash" && t[1])?.[1];

  const dimensions = event.tags.find((t) => t[0] === "dim" && t[1])?.[1];
  const [width, height] = dimensions?.split("x").map((v) => parseInt(v)) ?? [];

  if (!mimeType) throw new Error("missing MIME Type");
  if (width !== undefined && height !== undefined) {
    if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error("bad dimensions");
  }

  return {
    url,
    mimeType,
    width,
    height,
    magnet,
    infoHash,
    sha256Hash,
    blurhash,
    size: size ? parseInt(size) : undefined,
  };
}
