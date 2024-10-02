import { AppSettings } from "../../services/settings/migrations";
import { Nip07Interface } from "applesauce-signer";

interface ExtendedNip07Interface extends Nip07Interface {
  nip17?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
}

export class Account {
  readonly type: string = "unknown";
  pubkey: string;
  localSettings?: AppSettings;

  protected _signer?: ExtendedNip07Interface | undefined;
  public get signer(): ExtendedNip07Interface | undefined {
    return this._signer;
  }
  public set signer(value: ExtendedNip07Interface | undefined) {
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