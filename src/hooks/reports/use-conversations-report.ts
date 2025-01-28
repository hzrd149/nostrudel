import { useActiveAccount, useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useConversationsReport() {
  const account = useActiveAccount();
  const pubkey = account?.pubkey;

  // hardcode the report id to 'overview' so there is only ever one
  const report = useReport("CONVERSATIONS", pubkey ? "conversations" : undefined, pubkey ? { pubkey } : undefined);

  return useObservable(report?.value);
}
