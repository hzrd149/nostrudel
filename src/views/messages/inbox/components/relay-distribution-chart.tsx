import { GiftWrapsModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";

import RelayDistributionChart from "../../../../components/charts/relay-distribution-chart";

export default function InboxRelayDistributionChart() {
  const account = useActiveAccount()!;
  const events = useEventModel(GiftWrapsModel, [account.pubkey]);

  // Show message if no data to display
  if (!events || events.length === 0) {
    return <div>No messages to display</div>;
  }

  return <RelayDistributionChart events={events} title="Messages from inboxes" />;
}
