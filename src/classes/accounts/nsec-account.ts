import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { SimpleSigner } from "applesauce-signer";
import { Account } from "./account";

export default class NsecAccount extends Account {
  readonly type = "nsec";

  protected declare _signer?: SimpleSigner | undefined;
  public get signer(): SimpleSigner | undefined {
    return this._signer;
  }
  public set signer(value: SimpleSigner | undefined) {
    this._signer = value;
  }

  constructor(pubkey: string) {
    super(pubkey);
  }

  static newKey() {
    const key = generateSecretKey();
    const account = new NsecAccount(getPublicKey(key));
    account.signer = new SimpleSigner(key);
    return account;
  }

  static fromKey(key: Uint8Array) {
    const account = new NsecAccount(getPublicKey(key));
    account.signer = new SimpleSigner(key);
    return account;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      nsec: this.signer && nip19.nsecEncode(this.signer.key),
    };
  }

  fromJSON(data: any): this {
    const parse = nip19.decode(data.nsec);

    if (parse.type !== "nsec") throw new Error("Unknown nsec type");
    this.signer = new SimpleSigner(parse.data as Uint8Array);

    return this;
  }
}
