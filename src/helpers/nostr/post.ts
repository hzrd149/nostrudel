import { getMatchNostrLink } from "../regexp";
import { safeDecode } from "../nip19";
import { unique } from "../array";

/** @deprecated */
export function getPubkeysMentionedInContent(content: string, direct = false) {
  const matched = content.matchAll(getMatchNostrLink());

  const pubkeys: string[] = [];

  for (const match of matched) {
    const decode = safeDecode(match[2]);
    if (!decode) continue;

    switch (decode.type) {
      case "npub":
        pubkeys.push(decode.data);
        break;
      case "nprofile":
        pubkeys.push(decode.data.pubkey);
        break;
      case "nevent":
        if (decode.data.author && !direct) pubkeys.push(decode.data.author);
        break;
      case "naddr":
        if (decode.data.pubkey && !direct) pubkeys.push(decode.data.pubkey);
        break;
    }
  }

  return unique(pubkeys);
}
