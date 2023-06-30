import { bech32 } from "@scure/base";
import { isETag, isPTag, NostrEvent } from "../types/nostr-event";
import { parsePaymentRequest } from "./bolt11";

import { Kind0ParsedContent } from "./user-metadata";
import { nip57, utils } from "nostr-tools";

// based on https://github.com/nbd-wtf/nostr-tools/blob/master/nip57.ts
export async function getZapEndpoint(metadata: Kind0ParsedContent): Promise<null | string> {
  try {
    let lnurl: string = "";
    let { lud06, lud16 } = metadata;
    if (lud06) {
      let { words } = bech32.decode(lud06, 1000);
      let data = bech32.fromWords(words);
      lnurl = utils.utf8Decoder.decode(data);
    } else if (lud16) {
      let [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return null;
    }

    let res = await fetch(lnurl);
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

export function totalZaps(events: NostrEvent[]) {
  let total = 0;
  for (const event of events) {
    const bolt11 = event.tags.find((t) => t[0] === "bolt11")?.[1];
    try {
      if (bolt11) {
        const parsed = parsePaymentRequest(bolt11);
        if (parsed.amount) total += parsed.amount;
      }
    } catch (e) {}
  }
  return total;
}

function parseZapEvent(event: NostrEvent) {
  const zapRequestStr = event.tags.find(([t, v]) => t === "description")?.[1];
  if (!zapRequestStr) throw new Error("no description tag");

  const bolt11 = event.tags.find((t) => t[0] === "bolt11")?.[1];
  if (!bolt11) throw new Error("missing bolt11 invoice");

  const error = nip57.validateZapRequest(zapRequestStr);
  if (error) throw new Error(error);

  const zapRequest = JSON.parse(zapRequestStr) as NostrEvent;
  const payment = parsePaymentRequest(bolt11);

  const eventId = zapRequest.tags.find(isETag)?.[1];

  return {
    zap: event,
    request: zapRequest,
    payment,
    eventId,
  };
}

const zapEventCache = new Map<string, ReturnType<typeof parseZapEvent>>();
function cachedParseZapEvent(event: NostrEvent) {
  let result = zapEventCache.get(event.id);
  if (result) return result;
  result = parseZapEvent(event);
  if (result) zapEventCache.set(event.id, result);
  return result;
}

export { cachedParseZapEvent as parseZapEvent };
