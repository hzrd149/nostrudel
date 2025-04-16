import { useEffect } from "react";
import { Alert, AlertIcon, Button, ButtonGroup, Heading, Link, Text, useInterval } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import webRtcRelaysService from "../../../services/webrtc-relays";
import { QrCodeIcon } from "../../../components/icons";
import Connection from "./components/connection";
import useForceUpdate from "../../../hooks/use-force-update";
import SimpleView from "../../../components/layout/presets/simple-view";

export default function WebRtcRelaysView() {
  const update = useForceUpdate();
  useInterval(update, 1000);
  useEffect(() => {
    webRtcRelaysService.broker.on("call", update);

    return () => {
      webRtcRelaysService.broker.off("call", update);
    };
  }, [update]);

  const unanswered = webRtcRelaysService.pendingIncoming.length;

  return (
    <SimpleView
      title="WebRTC Relay"
      actions={
        <ButtonGroup size="sm" ml="auto">
          <Button as={RouterLink} to="/relays/webrtc/pair" leftIcon={<QrCodeIcon />}>
            Pair{unanswered > 0 ? ` (${unanswered})` : ""}
          </Button>
          <Button as={RouterLink} to="/relays/webrtc/connect" colorScheme="primary">
            Connect
          </Button>
        </ButtonGroup>
      }
    >
      <Text fontStyle="italic" mt="-2">
        WebRTC Relays are temporary relays that can be accessed over{" "}
        <Link href="https://webrtc.org/" target="_blank" color="blue.500">
          WebRTC
        </Link>
      </Text>

      <Heading size="md" mt="2">
        Connections:
      </Heading>
      {webRtcRelaysService.answered.length > 0 ? (
        webRtcRelaysService.answered.map(({ call, peer, pubkey }) => (
          <Connection
            key={pubkey}
            peer={peer}
            call={call}
            client={webRtcRelaysService.clients.get(pubkey)!}
            server={webRtcRelaysService.servers.get(pubkey)!}
          />
        ))
      ) : (
        <Alert status="info">
          <AlertIcon />
          No connections yet, use the "Invite" or "Connect" buttons to connect to peer
        </Alert>
      )}
    </SimpleView>
  );
}
