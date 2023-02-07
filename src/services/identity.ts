import { BehaviorSubject } from "rxjs";
import { unique } from "../helpers/array";
import settings from "./settings";

export type PresetRelays = Record<string, { read: boolean; write: boolean }>;

export type SavedIdentity = {
  pubkey: string;
  secKey?: string;
  useExtension: boolean;
};

class IdentityService {
  loading = new BehaviorSubject(true);
  setup = new BehaviorSubject(false);
  pubkey = new BehaviorSubject("");
  // TODO: remove this when there is a service to manage user relays
  relays = new BehaviorSubject<PresetRelays>({});
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

      // disabled because I dont want to load the preset relays yet (ably dose not support changing them)
      // const relays = await window.nostr.getRelays();
      // if (Array.isArray(relays)) {
      //   this.relays.next(relays.reduce<PresetRelays>((d, r) => ({ ...d, [r]: { read: true, write: true } }), {}));
      // } else this.relays.next(relays);
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

// TODO: create a service to manage user relays (download latest and handle conflicts)
identity.relays.subscribe((presetRelays) => {
  settings.relays.next(unique([...settings.relays.value, ...Object.keys(presetRelays)]));
});

export default identity;
