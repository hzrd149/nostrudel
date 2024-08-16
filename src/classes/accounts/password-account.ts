import PasswordSigner from "../signers/password-signer";
import { Account } from "./account";

export default class PasswordAccount extends Account {
  readonly type = "local";

  protected declare _signer: PasswordSigner;
  public get signer(): PasswordSigner {
    return this._signer;
  }
  public set signer(value: PasswordSigner) {
    this._signer = value;
  }

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = new PasswordSigner();
  }

  static fromNcryptsec(pubkey: string, ncryptsec: string) {
    const account = new PasswordAccount(pubkey);
    return account.fromJSON({ ncryptsec });
  }

  toJSON() {
    if (this.signer.ncryptsec) {
      return { ...super.toJSON(), ncryptsec: this.signer.ncryptsec };
    } else
      return { ...super.toJSON(), secKey: this.signer.buffer, iv: this.signer.iv, ncryptsec: this.signer.ncryptsec };
  }
  fromJSON(data: any): this {
    this.signer = new PasswordSigner();
    if (data.ncryptsec) {
      this.signer.ncryptsec = data.ncryptsec as string;
    } else if (data.secKey && data.iv) {
      this.signer.buffer = data.secKey as ArrayBuffer;
      this.signer.iv = data.iv as Uint8Array;
    }

    return super.fromJSON(data);
  }
}
