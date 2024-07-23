import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useForceUpdate,
  useInterval,
} from "@chakra-ui/react";
import { getPublicKey, nip19 } from "nostr-tools";

import BackButton from "../../../components/router/back-button";
import { QrCodeIcon } from "../../../components/icons";
import webRtcRelaysService from "../../../services/webrtc-relays";
import useSubject from "../../../hooks/use-subject";
import localSettings from "../../../services/local-settings";
import { CopyIconButton } from "../../../components/copy-icon-button";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";

function WebRtcRelaysPage() {
  const update = useForceUpdate();
  const identity = useSubject(localSettings.webRtcLocalIdentity);
  const pubkey = useMemo(() => getPublicKey(identity), [identity]);
  const npub = useMemo(() => nip19.npubEncode(pubkey), [pubkey]);

  const uri = "webrtc+nostr:" + npub;

  const [connectURI, setConnectURI] = useState("");

  useEffect(() => {
    webRtcRelaysService.broker.on("call", update);

    return () => {
      webRtcRelaysService.broker.off("call", update);
    };
  }, [update]);

  useInterval(update, 1000);

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1} px={{ base: "2", lg: 0 }}>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">WebRTC Relays</Heading>
      </Flex>

      <FormControl>
        <FormLabel>WebRTC Connection URI</FormLabel>
        <Flex gap="2" alignItems="center">
          <UserAvatar pubkey={pubkey} size="sm" />
          <Input readOnly userSelect="all" value={uri} />
          <CopyIconButton value={uri} aria-label="Copy Npub" />
        </Flex>
      </FormControl>

      <Heading size="md">Connect:</Heading>
      <Flex gap="2">
        <Input placeholder="webrtc+nostr:npub1..." value={connectURI} onChange={(e) => setConnectURI(e.target.value)} />
        <QRCodeScannerButton onData={(data) => setConnectURI(data)} />
        <Button
          colorScheme="primary"
          onClick={() => {
            webRtcRelaysService.connect(connectURI);
            setConnectURI("");
          }}
        >
          Connect
        </Button>
      </Flex>

      {webRtcRelaysService.answered.length > 0 && (
        <>
          <Heading size="md">Connections:</Heading>
          {webRtcRelaysService.answered.map((event) => (
            <Flex key={event.id} borderWidth="1px" rounded="md" p="2" alignItems="center" gap="2">
              <UserAvatar pubkey={event.pubkey} size="sm" />
              <UserName pubkey={event.pubkey} />
              <Button size="sm" ml="auto" colorScheme="red">
                Close
              </Button>
            </Flex>
          ))}
        </>
      )}

      {webRtcRelaysService.unanswered.length > 0 && (
        <>
          <Heading size="md">Connection Requests:</Heading>
          {webRtcRelaysService.unanswered.map((event) => (
            <Flex key={event.id} borderWidth="1px" rounded="md" p="2" alignItems="center" gap="2">
              <UserAvatar pubkey={event.pubkey} size="sm" />
              <UserName pubkey={event.pubkey} />
              <Button
                size="sm"
                ml="auto"
                colorScheme="green"
                onClick={() => {
                  webRtcRelaysService.acceptCall(event);
                  update();
                }}
              >
                Accept
              </Button>
            </Flex>
          ))}
        </>
      )}
    </Flex>
  );
}

export default function WebRtcRelaysView() {
  if (webRtcRelaysService) {
    return <WebRtcRelaysPage />;
  }
  return <Heading>WebRTC Relays don't work without</Heading>;
}
