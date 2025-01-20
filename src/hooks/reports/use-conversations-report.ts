import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";
import useCurrentAccount from "../use-current-account";

export default function useConversationsReport() {
  const account = useCurrentAccount();
  const pubkey = account?.pubkey;

  // hardcode the report id to 'overview' so there is only ever one
  const report = useReport("CONVERSATIONS", pubkey ? "conversations" : undefined, pubkey ? { pubkey } : undefined);

  return useObservable(report?.value);
}
