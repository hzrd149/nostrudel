import { use$, useActiveAccount } from "applesauce-react/hooks";
import { messaging$ } from "../services/messaging";

export default function useMessaging() {
  const account = useActiveAccount();
  const session = use$(messaging$);
  return session?.legacy.pubkey === account?.pubkey ? session : undefined;
}
