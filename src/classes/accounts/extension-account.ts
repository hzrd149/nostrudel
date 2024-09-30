import { Nip07Interface } from "applesauce-signer";
import { Account } from "./account";

export default class ExtensionAccount extends Account {
  readonly type = "extension";

  public get signer(): Nip07Interface | undefined {
    return window.nostr;
  }
  set signer(signer: Nip07Interface) {
    throw new Error("Cant update signer");
  }

  fromJSON(data: any): this {
    return super.fromJSON(data);
  }
}
