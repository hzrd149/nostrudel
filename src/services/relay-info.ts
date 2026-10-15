import { ensureHttpURL, normalizeURL } from "applesauce-core/helpers";
import { DEFAULT_INFORMATION_CACHE_MS, Relay } from "applesauce-relay";
import { RelayInformation } from "nostr-tools/nip11";
import { fetchWithProxy } from "../helpers/request";
import { logger } from "../helpers/debug";
import pool from "./pool";
import { relayInformationCache } from "./relay-information-cache";

const log = logger.extend("RelayInformation");

async function getInfo(relay: string, alwaysFetch = false): Promise<RelayInformation | null> {
  if (!alwaysFetch) return pool.relay(relay).getInformation();

  const info = await Relay.fetchInformationDocument(relay);
  if (info) {
    try {
      await relayInformationCache.set(normalizeURL(relay), info, DEFAULT_INFORMATION_CACHE_MS);
    } catch (error) {
      log("Failed to cache refreshed relay information", error);
    }
  }
  return info;
}

export const relayInfoService = { getInfo };

Relay.fetchInformationDocument = async (url) => {
  try {
    const response = await fetchWithProxy(ensureHttpURL(url), {
      headers: { Accept: "application/nostr+json" },
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    // Missing NIP-11 documents are supported; Applesauce exposes them as null.
    return null;
  }
};

if (import.meta.env.DEV) {
  Reflect.set(window, "relayInfoService", relayInfoService);
}

export default relayInfoService;
