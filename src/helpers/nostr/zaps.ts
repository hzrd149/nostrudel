import { bech32 } from "@scure/base";
import { isETag, isPTag, NostrEvent } from "../../types/nostr-event";
import { ParsedInvoice, parsePaymentRequest } from "../bolt11";

import { Kind0ParsedContent } from "./user-metadata";
import { nip57, utils } from "nostr-tools";
import verifyEvent from "../../services/verify-event";

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

export function getZapRecipient(event: NostrEvent) {
  return event.tags.find((t) => t[0] === "p" && t[1])?.[1];
}

export function totalZaps(zaps: ParsedZap[]) {
  return zaps.reduce((t, zap) => t + (zap.payment.amount || 0), 0);
}

export type ParsedZap = {
  event: NostrEvent;
  request: NostrEvent;
  payment: ParsedInvoice;
  eventId?: string;
};

const parsedZapSymbol = Symbol("parsedZap");
type ParsedZapEvent = NostrEvent & { [parsedZapSymbol]: ParsedZap | Error };

export function getParsedZap(event: NostrEvent, quite: false, returnError?: boolean): ParsedZap;
export function getParsedZap(event: NostrEvent, quite: true, returnError: true): ParsedZap | Error;
export function getParsedZap(event: NostrEvent, quite: true, returnError: false): ParsedZap | undefined;
export function getParsedZap(event: NostrEvent, quite?: boolean, returnError?: boolean): ParsedZap | undefined;
export function getParsedZap(event: NostrEvent, quite: boolean = true, returnError?: boolean) {
  const e = event as ParsedZapEvent;
  if (Object.hasOwn(e, parsedZapSymbol)) {
    const cached = e[parsedZapSymbol];
    if (!returnError && cached instanceof Error) return undefined;
    if (!quite && cached instanceof Error) throw cached;
    return cached;
  }

  try {
    return (e[parsedZapSymbol] = parseZapEvent(e));
  } catch (error) {
    if (error instanceof Error) {
      e[parsedZapSymbol] = error;
      if (quite) return returnError ? error : undefined;
      else throw error;
    } else throw error;
  }
}

export function parseZapEvents(events: NostrEvent[]) {
  const parsed: ParsedZap[] = [];

  for (const event of events) {
    const p = getParsedZap(event);
    if (p) parsed.push(p);
  }

  return parsed;
}

/** @deprecated use getParsedZap instead */
export function parseZapEvent(event: NostrEvent): ParsedZap {
  const zapRequestStr = event.tags.find(([t, v]) => t === "description")?.[1];
  if (!zapRequestStr) throw new Error("No description tag");

  const bolt11 = event.tags.find((t) => t[0] === "bolt11")?.[1];
  if (!bolt11) throw new Error("Missing bolt11 invoice");

  const error = nip57.validateZapRequest(zapRequestStr);
  if (error) throw new Error(error);

  const request = JSON.parse(zapRequestStr) as NostrEvent;
  if (!verifyEvent(request)) throw new Error("Invalid zap request");
  const payment = parsePaymentRequest(bolt11);

  return {
    event,
    request,
    payment,
  };
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
