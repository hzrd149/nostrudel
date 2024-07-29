import AmberSigner from "../signers/amber-signer";
import { Account } from "./account";

export default class AmberAccount extends Account {
  readonly type = "amber";
  signer: AmberSigner;

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = new AmberSigner();
  }
}
