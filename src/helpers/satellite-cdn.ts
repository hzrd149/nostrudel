import dayjs from "dayjs";
import { DraftNostrEvent, NostrEvent, Tag } from "../types/nostr-event";

const ROOT_URL = "https://api.satellite.earth/v1/media";
type Signer = (draft: DraftNostrEvent) => Promise<NostrEvent>;

export type SatelliteCDNUpload = {
  created: number;
  sha256: string;
  name: string;
  url: string;
  infohash: string;
  magnet: string;
  size: number;
  type: string;
  nip94: Tag[];
};
export type SatelliteCDNFile = {
  created: number;
  magnet: string;
  type: string;
  name?: string;
  sha256: string;
  size: number;
  url: string;
};
export type SatelliteCDNAccount = {
  timeRemaining: number;
  paidThrough: number;
  transactions: {
    order: NostrEvent;
    receipt: NostrEvent;
    payment: NostrEvent;
  }[];
  storageTotal: number;
  creditTotal: number;
  usageTotal: number;
  rateFiat: {
    usd: number;
  };
  exchangeFiat: {
    usd: number;
  };
  files: SatelliteCDNFile[];
};

export function getAccountAuthToken(signEvent: Signer) {
  return signEvent({
    created_at: dayjs().unix(),
    kind: 22242,
    content: "Authenticate User",
    tags: [],
  });
}

export async function getAccount(authToken: NostrEvent) {
  return fetch(`${ROOT_URL}/account?auth=${encodeURIComponent(JSON.stringify(authToken))}`).then((res) =>
    res.json(),
  ) as Promise<SatelliteCDNAccount>;
}

export async function deleteFile(sha256: string, signEvent: Signer) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: 22242,
    content: "Delete Item",
    tags: [["x", sha256]],
  };
  const signed = await signEvent(draft);
  await fetch(`${ROOT_URL}/item?auth=${encodeURIComponent(JSON.stringify(signed))}`, { method: "DELETE" });
}

export async function uploadFile(file: File, signEvent: Signer) {
  const draft: DraftNostrEvent = {
    created_at: dayjs().unix(),
    kind: 22242,
    content: "Authorize Upload",
    tags: [["name", file.name]],
  };
  const signed = await signEvent(draft);
  return (await fetch(`${ROOT_URL}/item?auth=${encodeURIComponent(JSON.stringify(signed))}`, {
    method: "PUT",
    body: file,
  }).then((res) => res.json())) as Promise<SatelliteCDNUpload>;
}
