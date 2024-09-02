import { Nip07Signer } from "../../types/nostr-extensions";
import { Account } from "./account";

export default class ExtensionAccount extends Account {
  readonly type = "extension";

  public get signer(): Nip07Signer | undefined {
    return window.nostr;
  }
  set signer(signer: Nip07Signer) {
    throw new Error("Cant update signer");
  }

  fromJSON(data: any): this {
    return super.fromJSON(data);
  }
}
