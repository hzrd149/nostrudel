import { BehaviorSubject } from "rxjs";
import settings from "./settings";

export type SavedIdentity = {
  pubkey: string;
  secKey?: string;
  useExtension: boolean;
};

class IdentityService {
  loading = new BehaviorSubject(true);
  setup = new BehaviorSubject(false);
  pubkey = new BehaviorSubject("");
  private useExtension: boolean = false;
  private secKey: string | undefined = undefined;

  constructor() {
    settings.identity.subscribe((savedIdentity) => {
      this.loading.next(false);
      if (savedIdentity) {
        this.setup.next(true);
        this.pubkey.next(savedIdentity.pubkey);
        this.secKey = savedIdentity.secKey;
        this.useExtension = savedIdentity.useExtension;
      } else {
        this.setup.next(false);
        this.pubkey.next("");
        this.secKey = undefined;
        this.useExtension = false;
      }
    });
  }

  async loginWithExtension() {
    if (window.nostr) {
      const pubkey = await window.nostr.getPublicKey();
      settings.identity.next({
        pubkey,
        useExtension: true,
      });
    }
  }

  loginWithSecKey(secKey: string) {
    // const pubkey =
    // settings.identity.next({
    //   pubkey,
    //   useExtension: true,
    // });
  }

  async logout() {
    settings.identity.next(null);
  }
}

const identity = new IdentityService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.identity = identity;
}

export default identity;
