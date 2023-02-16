import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import accountService from "./account";
import { signEvent, getEventHash, getPublicKey } from "nostr-tools";

class SigningService {
  async requestSignature(draft: DraftNostrEvent) {
    const account = accountService.current.value;

    if (account?.readonly) throw new Error("cant sign in readonly mode");
    if (account?.useExtension) {
      if (window.nostr) {
        const signed = await window.nostr.signEvent(draft);
        if (signed.pubkey !== account.pubkey) throw new Error("signed with the wrong pubkey!");
        return signed;
      } else throw new Error("missing nostr extension");
    } else if (account?.secKey) {
      const tmpDraft = { ...draft, pubkey: getPublicKey(account.secKey) };
      const signature = signEvent(tmpDraft, account.secKey);
      const event: NostrEvent = {
        ...tmpDraft,
        id: getEventHash(tmpDraft),
        sig: signature,
      };

      return event;
    } else throw new Error("no signing method");
  }
}

const signingService = new SigningService();

export default signingService;
