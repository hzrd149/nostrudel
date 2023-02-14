import { PersistentSubject, Subject } from "../classes/subject";
import settings from "./settings";

export type PresetRelays = Record<string, { read: boolean; write: boolean }>;

export type SavedIdentity = {
  pubkey: string;
  secKey?: string;
  useExtension: boolean;
};

class IdentityService {
  loading = new PersistentSubject(false);
  setup = new PersistentSubject(false);
  pubkey = new Subject<string>();
  readonly = new PersistentSubject(false);
  // directory of relays provided by nip07 extension
  relays = new Subject<PresetRelays>({});
  private useExtension: boolean = false;
  private secKey: string | undefined = undefined;

  constructor() {
    settings.identity.subscribe((savedIdentity) => {
      this.loading.next(false);
      if (savedIdentity) {
        this.setup.next(true);
        this.pubkey.next(savedIdentity.pubkey);
        this.readonly.next(false);
        this.secKey = savedIdentity.secKey;
        this.useExtension = savedIdentity.useExtension;
      } else {
        this.setup.next(false);
        this.pubkey.next("");
        this.readonly.next(false);
        this.secKey = undefined;
        this.useExtension = false;
      }
    });
  }

  async loginWithExtension() {
    if (window.nostr) {
      try {
        this.loading.next(true);
        const pubkey = await window.nostr.getPublicKey();
        const relays = await window.nostr.getRelays();

        if (Array.isArray(relays)) {
          this.relays.next(relays.reduce<PresetRelays>((d, r) => ({ ...d, [r]: { read: true, write: true } }), {}));
        } else {
          this.relays.next(relays);
        }

        settings.identity.next({
          pubkey,
          useExtension: true,
        });
      } catch (e) {
        this.loading.next(false);
      }
    }
  }

  // loginWithSecKey(secKey: string) {
  // const pubkey =
  // settings.identity.next({
  //   pubkey,
  //   useExtension: true,
  // });
  // }

  loginWithPubkey(pubkey: string) {
    this.readonly.next(true);
    this.pubkey.next(pubkey);
    this.setup.next(true);
    this.loading.next(false);
  }

  logout() {
    settings.identity.next(null);
  }
}

const identityService = new IdentityService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.identity = identityService;
}

export default identityService;
