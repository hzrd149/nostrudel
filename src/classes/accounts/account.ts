import { AppSettings } from "../../services/settings/migrations";
import { Nip07Signer } from "../../types/nostr-extensions";

export class Account {
  readonly type: string = "unknown";
  pubkey: string;
  localSettings?: AppSettings;

  protected _signer?: Nip07Signer | undefined;
  public get signer(): Nip07Signer | undefined {
    return this._signer;
  }
  public set signer(value: Nip07Signer | undefined) {
    this._signer = value;
  }

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
