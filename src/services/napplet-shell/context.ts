import type { KehtoContext } from "applesauce-extra/kehto";
import type { ISigner } from "applesauce-signers";
import { map } from "rxjs";

import accounts from "../accounts";
import { eventStore } from "../event-store";
import pool from "../pool";
import { assertNappletDecryption, assertNappletEventKind } from "../../helpers/nostr/handler-preferences";

export function restrictNappletSigner(signer: ISigner): ISigner {
  return {
    getPublicKey: () => signer.getPublicKey(),
    signEvent: (event) => {
      assertNappletEventKind(event.kind);
      return signer.signEvent(event);
    },
    nip04: signer.nip04,
    nip44: signer.nip44 && {
      encrypt: signer.nip44.encrypt.bind(signer.nip44),
      decrypt: async (pubkey, ciphertext) => {
        assertNappletDecryption(pubkey, await signer.getPublicKey());
        return signer.nip44!.decrypt(pubkey, ciphertext);
      },
    },
  };
}

export function getNappletSigner() {
  return accounts.active ? restrictNappletSigner(accounts.active) : null;
}

/** Shared infrastructure for the host integrations; services retain their own permission gates. */
export const kehtoContext: KehtoContext = {
  pool,
  eventStore,
  signer: accounts.active$.pipe(map((account) => (account ? restrictNappletSigner(account) : undefined))),
  // Reads must not silently expose plaintext from the user's encrypted events.
  decrypt: false,
  approve: ({ template }) => {
    assertNappletEventKind(template.kind);
    return true;
  },
};
