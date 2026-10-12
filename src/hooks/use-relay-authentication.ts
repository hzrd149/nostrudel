import { use$, useActiveAccount } from "applesauce-react/hooks";

import pool from "../services/pool";

/** Read the active account's verdict, rather than the last account authenticated on the socket. */
export default function useRelayAuthentication(url: string) {
  const account = useActiveAccount();
  const authentications = use$(() => pool.relay(url).authentications$, [url]);
  const response = account ? authentications?.[account.pubkey]?.response : undefined;
  return { response, authenticated: response?.ok === true };
}
