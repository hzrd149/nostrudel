import { Account } from "./account";

export default class PubkeyAccount extends Account {
  readonly type = "pubkey";

  constructor(pubkey: string) {
    super(pubkey);
  }
}
