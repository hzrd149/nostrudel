import db from "./db";
import { fetchWithCorsFallback } from "../helpers/cors";

export type RelayInformationDocument = {
  name: string;
  description: string;
  icon?: string;
  pubkey: string;
  contact: string;
  supported_nips?: number[];
  software: string;
  version: string;
};

async function fetchInfo(relay: string) {
  const url = new URL(relay);
  url.protocol = url.protocol === "ws:" ? "http" : "https";

  const infoDoc = await fetchWithCorsFallback(url, { headers: { Accept: "application/nostr+json" } }).then(
    (res) => res.json() as Promise<RelayInformationDocument>,
  );

  memoryCache.set(relay, infoDoc);
  await db.put("relayInfo", infoDoc, relay);

  return infoDoc;
}

const memoryCache = new Map<string, RelayInformationDocument>();
async function getInfo(relay: string) {
  if (memoryCache.has(relay)) return memoryCache.get(relay)!;

  const cached = await db.get("relayInfo", relay);
  if (cached) {
    memoryCache.set(relay, cached);
    return cached as RelayInformationDocument;
  }

  return fetchInfo(relay);
}

const pending: Record<string, ReturnType<typeof getInfo> | undefined> = {};
function dedupedGetIdentity(relay: string) {
  const request = pending[relay];
  if (request) return request;
  return (pending[relay] = getInfo(relay).then((v) => {
    delete pending[relay];
    return v;
  }));
}

export const relayInfoService = {
  cache: memoryCache,
  fetchInfo,
  getInfo: dedupedGetIdentity,
};

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
}

export default relayInfoService;
