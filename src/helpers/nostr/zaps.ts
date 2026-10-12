import { bech32 } from "@scure/base";
import { NostrEvent, utils } from "nostr-tools";
import { AddressPointer, EventPointer, isETag, isPTag, ProfileContent } from "applesauce-core/helpers";
import { getZapPayment, ZapEvent } from "applesauce-common/helpers";

// based on https://github.com/nbd-wtf/nostr-tools/blob/master/nip57.ts
export async function getZapEndpoint(metadata: ProfileContent): Promise<null | string> {
  try {
    let lnurl: string = "";
    const { lud06, lud16 } = metadata;
    if (lud06) {
      const { words } = bech32.decode(lud06 as `${string}1${string}`, 1000);
      const data = bech32.fromWords(words);
      lnurl = utils.utf8Decoder.decode(data);
    } else if (lud16) {
      const [name, domain] = lud16.split("@");
      // aislop-ignore-next-line ai-slop/hardcoded-url -- LUD-16 defines the pay endpoint of a lightning address name@domain as https://<domain>/.well-known/lnurlp/<name>; the host comes from the user's address, so there is nothing to configure
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return null;
    }

    const res = await fetch(lnurl);
    const body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch {
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

export type TZapGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer?: AddressPointer;
  events: ZapEvent[];
  latest: number;
};
