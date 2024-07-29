import { AppSettings } from "../../services/settings/migrations";
import { Nip07Signer } from "../../types/nostr-extensions";

export class Account {
  readonly type: string = "unknown";
  pubkey: string;
  signer?: Nip07Signer;
  localSettings?: AppSettings;

  get readonly() {
    return !this.signer;
  }

  constructor(pubkey: string) {
    this.pubkey = pubkey;
  }

  toJSON(): any {
    return { type: this.type, pubkey: this.pubkey, localSettings: this.localSettings };
  }
  fromJSON(data: any): this {
    this.pubkey = data.pubkey;
    if (data.localSettings) {
      this.localSettings = data.localSettings;
    }
    return this;
  }
}
