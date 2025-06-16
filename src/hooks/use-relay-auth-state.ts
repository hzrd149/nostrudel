import { useObservableEagerState } from "applesauce-react/hooks";
import authenticationSigner, { RelayAuthState } from "../services/authentication-signer";

export default function useRelayAuthState(relay: string): RelayAuthState | undefined {
  const states = useObservableEagerState(authenticationSigner.relayState$);
  return states[relay];
}
