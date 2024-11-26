import { AppSettings } from "../../helpers/app-settings";
import { Nip07Interface } from "applesauce-signer";

export class Account {
  readonly type: string = "unknown";
  pubkey: string;
  localSettings?: Partial<AppSettings>;

  protected _signer?: Nip07Interface | undefined;
  public get signer(): Nip07Interface | undefined {
    return this._signer;
  }
  public set signer(value: Nip07Interface | undefined) {
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
    if (data.pubkey) this.pubkey = data.pubkey;

    if (data.localSettings) {
      this.localSettings = data.localSettings;
    }
    return this;
  }
}
