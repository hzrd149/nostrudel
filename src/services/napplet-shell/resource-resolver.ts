import { ResourceServiceError, type ResourceServiceOptions as ResolverOptions } from "@kehto/services";
import { parseBlossomURI } from "blossom-client-sdk";
import { nip19, verifyEvent, type NostrEvent } from "nostr-tools";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { logger } from "../../helpers/debug";
import type { ResourcePermission } from "./permission-types";

const log = logger.extend("napplet-resources");
export const MAX_RESOURCE_BYTES = 25 * 1024 * 1024;
export type ResourceResolverOptions = {
  getBlossomOrigins(): string[];
  authorize(windowId: string, permission: ResourcePermission, signal: AbortSignal): Promise<boolean>;
  loadNostr(reference: string, signal: AbortSignal): Promise<NostrEvent | undefined>;
};

function httpsUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new ResourceServiceError("unsupported-scheme", "Expected an HTTPS resource without credentials");
  return url;
}

async function fetchBytes(value: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const response = await fetch(httpsUrl(value).href, {
    signal,
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new ResourceServiceError("not-found", "Resource request failed");
  if (Number(response.headers.get("content-length")) > MAX_RESOURCE_BYTES)
    throw new ResourceServiceError("too-large", "Resource exceeds 25 MiB");
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESOURCE_BYTES) throw new ResourceServiceError("too-large", "Resource exceeds 25 MiB");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

function response(bytes: Uint8Array, mime?: string) {
  const at = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  mime ??= at(137, 80, 78, 71, 13, 10, 26, 10)
    ? "image/png"
    : at(255, 216, 255)
      ? "image/jpeg"
      : "application/octet-stream";
  return new Response(new Uint8Array(bytes), { headers: { "content-type": mime } });
}

/** Resource kinds authorize resolution, independently of relay/outbox and generic HTTPS access. */
export function createResourceResolver(options: ResourceResolverOptions): ResolverOptions["fetch"] {
  return async (value, init) => {
    const signal = AbortSignal.any([init.signal, AbortSignal.timeout(30000)]);
    const authorize = async (permission: ResourcePermission) => {
      signal.throwIfAborted();
      if (!init.windowId || !(await options.authorize(init.windowId, permission, signal)))
        throw new ResourceServiceError("blocked-by-policy", "Resource access denied");
      signal.throwIfAborted();
    };
    if (value.startsWith("nostr:")) {
      const pointer = (() => {
        try {
          return nip19.decode(value.slice(6));
        } catch {
          throw new ResourceServiceError("invalid-request", "Expected a Nostr event reference");
        }
      })();
      if (!["note", "nevent", "naddr"].includes(pointer.type))
        throw new ResourceServiceError("invalid-request", "Expected a Nostr event reference");
      await authorize("resource:nostr");
      const event = await options.loadNostr(value.slice(6), signal);
      signal.throwIfAborted();
      const matches =
        event &&
        verifyEvent(event) &&
        (pointer.type === "note"
          ? event.id === pointer.data
          : pointer.type === "nevent"
            ? event.id === pointer.data.id &&
              (!pointer.data.author || event.pubkey === pointer.data.author) &&
              (pointer.data.kind === undefined || event.kind === pointer.data.kind)
            : pointer.type === "naddr" &&
              event.pubkey === pointer.data.pubkey &&
              event.kind === pointer.data.kind &&
              event.tags.find((tag) => tag[0] === "d")?.[1] === pointer.data.identifier);
      if (!matches || !event) throw new ResourceServiceError("not-found", "No matching verified Nostr event was found");
      return response(new TextEncoder().encode(JSON.stringify(event)), "application/json");
    }
    const explicit = value.startsWith("blossom:");
    const url = explicit ? undefined : httpsUrl(value);
    const match = url && /^\/([a-f0-9]{64})(?:\.([a-zA-Z0-9]+))?$/i.exec(url.pathname);
    if (explicit || match) {
      const blob = explicit
        ? (() => {
            try {
              return parseBlossomURI(value);
            } catch {
              throw new ResourceServiceError("invalid-request", "Invalid Blossom resource");
            }
          })()
        : { sha256: match![1].toLowerCase(), ext: match![2] ?? "", servers: [url!.origin] };
      if (!/^[a-f0-9]{64}$/i.test(blob.sha256) || (blob.ext && !/^[a-zA-Z0-9]+$/.test(blob.ext)))
        throw new ResourceServiceError("invalid-request", "Invalid Blossom resource");
      await authorize("resource:blossom");
      const candidates = [
        ...new Set([
          ...(url ? [url.href] : []),
          ...[...blob.servers, ...(init.servers ?? []), ...options.getBlossomOrigins()].flatMap((server) => {
            try {
              return [
                httpsUrl(server.includes("://") ? server : `https://${server}`).origin +
                  `/${blob.sha256}${blob.ext ? `.${blob.ext}` : ""}`,
              ];
            } catch {
              return [];
            }
          }),
        ]),
      ].slice(0, 8);
      for (const candidate of candidates) {
        try {
          const bytes = await fetchBytes(candidate, signal);
          if (bytesToHex(sha256(bytes)) === blob.sha256.toLowerCase()) return response(bytes);
        } catch (error) {
          signal.throwIfAborted();
          log("Blossom candidate failed", error);
        }
      }
      if (!url) throw new ResourceServiceError("not-found", "No server returned a verified Blossom resource");
      // An unverified hash-shaped HTTPS response requires a separate HTTPS grant.
    }
    await authorize("resource:https");
    return response(await fetchBytes(url!.href, signal));
  };
}
