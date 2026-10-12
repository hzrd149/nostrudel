import { Nip07Interface } from "applesauce-signers";
import { BehaviorSubject } from "rxjs";

import AuthenticationSigner, { RelayAuthMode } from "../classes/authentication-signer";
import accounts from "./accounts";
import localSettings from "./preferences";
import pool from "./pool";

export type { RelayAuthMode, RelayAuthState } from "../classes/authentication-signer";

const authenticationSigner = new AuthenticationSigner(accounts.active$ as BehaviorSubject<Nip07Interface | undefined>);

/** Explicit UI authentication also supports retrying after a refused signature or AUTH verdict. */
export async function authenticateRelay(url: string) {
  const state = authenticationSigner.getRelayState(url);
  if (state?.status === "requested" || state?.status === "signing") {
    await authenticationSigner.authenticate(url);
    return;
  }

  const account = accounts.active;
  if (!account) throw new Error("No active account");
  const response = await pool.relay(url).authenticate(account);
  if (!response.ok) throw new Error(response.message || "Authentication rejected");
}

// update signer based on local settings
localSettings.defaultAuthenticationMode.subscribe((mode) => (authenticationSigner.defaultMode = mode as RelayAuthMode));
localSettings.relayAuthenticationMode.subscribe((relays) => {
  authenticationSigner.relayMode.clear();

  for (const { relay, mode } of relays) {
    authenticationSigner.relayMode.set(relay, mode);
  }
});

export default authenticationSigner;
