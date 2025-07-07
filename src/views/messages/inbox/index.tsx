import { useObservableState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../../services/lifecycle";
import LockedMessagesSection from "./components/locked-messages";
import RelayDistributionChart from "./components/relay-distribution-chart";
import { Box } from "@chakra-ui/react";

export default function InboxView() {
  useAppTitle("Messages inbox");

  // Keep a subscription open for NIP-04 and NIP-17 messages
  useObservableState(legacyMessageSubscription);
  useObservableState(wrappedMessageSubscription);
  return (
    <SimpleView title="Inbox">
      <Box w="full" overflow="hidden">
        <RelayDistributionChart />
      </Box>
      <LockedMessagesSection />
    </SimpleView>
  );
}
