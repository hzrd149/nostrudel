import { use$ } from "applesauce-react/hooks";
import authenticationSigner, { RelayAuthState } from "../services/authentication-signer";

export default function useRelayAuthState(relay: string): RelayAuthState | undefined {
  const states = use$(authenticationSigner.relayState$);
  return states[relay];
}
