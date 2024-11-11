import { PasswordSigner } from "applesauce-signer";
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
    account.pubkey = pubkey;
    return account.fromJSON({ ncryptsec });
  }

  toJSON() {
    return { ...super.toJSON(), ncryptsec: this.signer.ncryptsec };
  }
  fromJSON(data: any): this {
    if (typeof data.ncryptsec !== "string") throw new Error("Missing ncryptsec");
    this.signer = new PasswordSigner();
    this.signer.ncryptsec = data.ncryptsec as string;

    return super.fromJSON(data);
  }
}
