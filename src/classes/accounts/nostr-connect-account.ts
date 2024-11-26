import { NostrConnectSigner, SimpleSigner } from "applesauce-signer/signers";
import { hexToBytes } from "@noble/hashes/utils";

import { DEFAULT_NOSTR_CONNECT_RELAYS } from "../../const";
import { Account } from "./account";
import relayPoolService from "../../services/relay-pool";

function createSigner(pubkey: string, relays: string[], secretKey?: string, provider?: string) {
  const signer = secretKey ? new SimpleSigner(hexToBytes(secretKey)) : undefined;

  const client = new NostrConnectSigner({ pool: relayPoolService, pubkey, relays, signer, remote: provider });

  return client;
}

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
    this.signer = signer || createSigner(pubkey, DEFAULT_NOSTR_CONNECT_RELAYS);
  }

  toJSON() {
    const json = this.signer.toJSON();
    return {
      ...super.toJSON(),
      signerRelays: this.signer.relays,
      clientSecretKey: json.client,
    };
  }
  fromJSON(data: any): this {
    super.fromJSON(data);
    this.signer = createSigner(data.pubkey, data.signerRelays, data.clientSecretKey);

    return this;
  }
}
