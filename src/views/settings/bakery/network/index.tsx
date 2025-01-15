import { Box, Divider, Flex } from "@chakra-ui/react";

import HyperNetworkStatus from "./hyper";
import TorNetworkStatus from "./tor";
import I2PNetworkStatus from "./i2p";
import GossipSettings from "./gossip";
import SimpleView from "../../../../components/layout/presets/simple-view";

export default function BakeryNetworkSettingsView() {
  return (
    <SimpleView title="Network Settings" maxW="4xl" gap="4">
      <HyperNetworkStatus />
      <Box px="4">
        <Divider />
      </Box>
      <TorNetworkStatus />
      <Box px="4">
        <Divider />
      </Box>
      <I2PNetworkStatus />
      <Box px="4">
        <Divider />
      </Box>
      <GossipSettings />
    </SimpleView>
  );
}
