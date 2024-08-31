import { DEFAULT_NOSTR_CONNECT_RELAYS } from "../../const";
import nostrConnectService from "../../services/nostr-connect";
import NostrConnectSigner from "../signers/nostr-connect-signer";
import { Account } from "./account";

export default class NostrConnectAccount extends Account {
  readonly type = "nostr-connect";

  protected declare _signer: NostrConnectSigner;
  public get signer(): NostrConnectSigner {
    return this._signer;
  }
  public set signer(value: NostrConnectSigner) {
    this._signer = value;
  }

  constructor(pubkey: string, signer?: NostrConnectSigner) {
    super(pubkey);
    this.signer = signer || nostrConnectService.createSigner(pubkey, DEFAULT_NOSTR_CONNECT_RELAYS);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      signerRelays: this.signer.relays,
      clientSecretKey: this.signer.secretKey,
    };
  }
  fromJSON(data: any): this {
    super.fromJSON(data);
    this.signer = nostrConnectService.createSigner(data.pubkey, data.signerRelays, data.clientSecretKey);

    // presume the client has already connected
    nostrConnectService.saveSigner(data.pubKey);

    return this;
  }
}
