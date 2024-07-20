import { Button, ButtonGroup, Code, Flex, Heading, Link, Text } from "@chakra-ui/react";
import BackButton from "../../../components/router/back-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import { useUserDNSIdentity } from "../../../hooks/use-user-dns-identity";
import { Link as RouterLink } from "react-router-dom";

import { RelayFavicon } from "../../../components/relay-favicon";
import { QrCodeIcon } from "../../../components/icons";

import "./connect";

export default function WebRtcRelaysView() {
  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1} px={{ base: "2", lg: 0 }}>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">WebRTC Relays</Heading>

        <ButtonGroup size="sm" ml="auto">
          <Button leftIcon={<QrCodeIcon />}>Pair</Button>
          <Button colorScheme="primary">Connect</Button>
        </ButtonGroup>
      </Flex>

      {/* <Text fontStyle="italic" mt="-2">
        These relays cant be modified by noStrudel, they must be set manually on your
      </Text> */}
    </Flex>
  );
}
