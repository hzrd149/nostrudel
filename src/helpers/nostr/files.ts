import { NostrEvent } from "../../types/nostr-event";

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

export function parseImageFile(event: NostrEvent): ParsedImageFile {
  const url = event.tags.find((t) => t[0] === "url" && t[1])?.[1];
  const mimeType = event.tags.find((t) => t[0] === "m" && t[1])?.[1];
  const magnet = event.tags.find((t) => t[0] === "magnet" && t[1])?.[1];
  const infoHash = event.tags.find((t) => t[0] === "i" && t[1])?.[1];
  const size = event.tags.find((t) => t[0] === "i" && t[1])?.[1];
  const sha256Hash = event.tags.find((t) => t[0] === "x" && t[1])?.[1];
  const blurhash = event.tags.find((t) => t[0] === "blurhash" && t[1])?.[1];

  const dimensions = event.tags.find((t) => t[0] === "dim" && t[1])?.[1];
  const [width, height] = dimensions?.split("x").map((v) => parseInt(v)) ?? [];

  if (!url) throw new Error("missing url");
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
