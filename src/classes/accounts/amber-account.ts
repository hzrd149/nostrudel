import { AmberClipboardSigner } from "applesauce-signer/signers/amber-clipboard-signer";
import { Account } from "./account";

export default class AmberAccount extends Account {
  readonly type = "amber";

  protected declare _signer?: AmberClipboardSigner | undefined;
  public get signer(): AmberClipboardSigner | undefined {
    return this._signer;
  }
  public set signer(value: AmberClipboardSigner | undefined) {
    this._signer = value;
  }

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = new AmberClipboardSigner();
    this.signer.pubkey = pubkey;
  }
}
