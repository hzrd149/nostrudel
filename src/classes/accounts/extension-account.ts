import { Nip07Signer } from "../../types/nostr-extensions";
import { Account } from "./account";

export default class ExtensionAccount extends Account {
  readonly type = "extension";

  override get signer() {
    if (!window.nostr) throw new Error("Missing NIP-07 signer extension");
    return window.nostr;
  }
  set signer(signer: Nip07Signer) {
    throw new Error("Cant update signer");
  }

  fromJSON(data: any): this {
    return super.fromJSON(data);
  }
}
