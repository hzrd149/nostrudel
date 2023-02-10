import db from "./db";

export type RelayInformationDocument = {
  name: string;
  description: string;
  pubkey: string;
  contact: string;
  supported_nips: string;
  software: string;
  version: string;
};
export type DnsIdentity = {
  name: string;
  domain: string;
  pubkey: string;
  relays: string[];
};

async function fetchInfo(relay: string) {
  const url = new URL(relay);
  url.protocol = url.protocol === "ws:" ? "http" : "https";

  const infoDoc = await fetch(url, { headers: { Accept: "application/nostr+json" } }).then(
    (res) => res.json() as Promise<RelayInformationDocument>
  );

  await db.put("relayInfo", infoDoc, relay);

  return infoDoc;
}

async function getInfo(relay: string) {
  const cached = await db.get("relayInfo", relay);
  if (cached) return cached;

  // TODO: if it fails, maybe cache a failure message
  return fetchInfo(relay);
}

const pending: Record<string, ReturnType<typeof getInfo> | undefined> = {};
function dedupedGetIdentity(relay: string) {
  const request = pending[relay];
  if (request) return request;
  return (pending[relay] = getInfo(relay));
}

export const relayInfoService = {
  fetchInfo,
  getInfo: dedupedGetIdentity,
};

if (import.meta.env.DEV) {
  // @ts-ignore
  window.relayInfoService = relayInfoService;
}

export default relayInfoService;
