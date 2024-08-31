import AmberSigner from "../signers/amber-signer";
import { Account } from "./account";

export default class AmberAccount extends Account {
  readonly type = "amber";

  protected declare _signer?: AmberSigner | undefined;
  public get signer(): AmberSigner | undefined {
    return this._signer;
  }
  public set signer(value: AmberSigner | undefined) {
    this._signer = value;
  }

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = new AmberSigner();
  }
}
