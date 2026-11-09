import { use$ } from "applesauce-react/hooks";
import useMessaging from "../../../../hooks/use-messaging";

import RelayDistributionChart from "../../../../components/charts/relay-distribution-chart";

export default function InboxRelayDistributionChart() {
  const session = useMessaging();
  const events = use$(() => session?.wrapped.giftWraps$, [session]);

  // Show message if no data to display
  if (!events || events.length === 0) {
    return <div>No messages to display</div>;
  }

  return <RelayDistributionChart events={events} title="Messages from inboxes" />;
}
