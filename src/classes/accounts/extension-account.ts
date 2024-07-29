import { Nip07Signer } from "../../types/nostr-extensions";
import { Account } from "./account";

export default class ExtensionAccount extends Account {
  readonly type = "extension";
  signer?: Nip07Signer;

  constructor(pubkey: string) {
    super(pubkey);
    this.signer = window.nostr;
  }

  fromJSON(data: any): this {
    if (!window.nostr) throw new Error("Missing NIP-07 signer extension");
    this.signer = window.nostr;
    return super.fromJSON(data);
  }
}
