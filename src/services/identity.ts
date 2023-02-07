import { BehaviorSubject } from "rxjs";

class IdentityService {
  setup = new BehaviorSubject(false);
  pubkey = new BehaviorSubject("");

  async requestKeysFromWindow() {
    if (window.nostr) {
      const pubkey = await window.nostr.getPublicKey();
      this.pubkey.next(pubkey);
      this.setup.next(true);
    }
  }
}

const identity = new IdentityService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.identity = identity;
}

export default identity;
