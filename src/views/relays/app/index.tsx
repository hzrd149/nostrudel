import { Button, Flex, Heading } from "@chakra-ui/react";
import useSubject from "../../../hooks/use-subject";
import { offlineMode } from "../../../services/offline-mode";
import WifiOff from "../../../components/icons/wifi-off";
import Wifi from "../../../components/icons/wifi";
import BackButton from "../../../components/back-button";

export default function AppRelays() {
  const offline = useSubject(offlineMode);

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="md">App Relays</Heading>
        <Button
          onClick={() => offlineMode.next(!offline)}
          leftIcon={offline ? <WifiOff /> : <Wifi />}
          ml="auto"
          size={{ base: "sm", lg: "md" }}
        >
          {offline ? "Offline" : "Online"}
        </Button>
      </Flex>
    </Flex>
  );
}
