import { bech32 } from "@scure/base";
import { NostrEvent, utils } from "nostr-tools";
import { getZapPayment, isETag, isPTag, ProfileContent } from "applesauce-core/helpers";

import { fetchWithProxy } from "../request";

// based on https://github.com/nbd-wtf/nostr-tools/blob/master/nip57.ts
export async function getZapEndpoint(metadata: ProfileContent): Promise<null | string> {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = metadata;
    if (lud06) {
      let { words } = bech32.decode(lud06 as `${string}1${string}`, 1000);
      let data = bech32.fromWords(words);
      lnurl = utils.utf8Decoder.decode(data);
    } else if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return null;
    }

    let res = await fetchWithProxy(lnurl);
    let body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    /*-*/
  }

  return null;
}

export function isNoteZap(event: NostrEvent) {
  return event.tags.some(isETag);
}
export function isProfileZap(event: NostrEvent) {
  return !isNoteZap(event) && event.tags.some(isPTag);
}

export function totalZaps(zaps: NostrEvent[]) {
  return zaps.map(getZapPayment).reduce((t, p) => t + (p?.amount ?? 0), 0);
}

export type EventSplit = { pubkey: string; percent: number; relay?: string }[];
export function getZapSplits(event: NostrEvent, fallbackPubkey?: string): EventSplit {
  const tags = event.tags.filter((t) => t[0] === "zap" && t[1] && t[3]) as [string, string, string, string][];

  if (tags.length > 0) {
    const targets = tags
      .map((t) => ({ pubkey: t[1], relay: t[2], percent: parseFloat(t[3]) }))
      .filter((p) => Number.isFinite(p.percent));

    const total = targets.reduce((v, p) => v + p.percent, 0);
    return targets.map((p) => ({ ...p, percent: p.percent / total }));
  } else return [{ pubkey: fallbackPubkey || event.pubkey, relay: "", percent: 1 }];
}
