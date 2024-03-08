import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  ModalProps,
  Text,
  Flex,
  ButtonGroup,
  Spacer,
  ModalHeader,
} from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import { LightningIcon } from "../icons";
import { ParsedZap } from "../../helpers/nostr/zaps";
import { readablizeSats } from "../../helpers/bolt11";
import useEventReactions from "../../hooks/use-event-reactions";
import useEventZaps from "../../hooks/use-event-zaps";
import Timestamp from "../timestamp";
import { getEventUID } from "../../helpers/nostr/event";
import ReactionDetails from "./reaction-details";
import RepostDetails from "./repost-details";

const ZapEvent = React.memo(({ zap }: { zap: ParsedZap }) => {
  if (!zap.payment.amount) return null;

  return (
    <>
      <Flex gap="2" alignItems="center">
        <UserAvatarLink pubkey={zap.request.pubkey} size="xs" mr="2" />
        <UserLink pubkey={zap.request.pubkey} />
        <Timestamp timestamp={zap.event.created_at} />
        <Spacer />
        <LightningIcon color="yellow.500" />
        <Text fontWeight="bold">{readablizeSats(zap.payment.amount / 1000)}</Text>
      </Flex>
      <Text>{zap.request.content}</Text>
    </>
  );
});

export default function EventInteractionDetailsModal({
  isOpen,
  onClose,
  event,
  size = "2xl",
  ...props
}: Omit<ModalProps, "children"> & { event: NostrEvent }) {
  const uuid = getEventUID(event);
  const zaps = useEventZaps(uuid, [], true) ?? [];
  const reactions = useEventReactions(uuid, [], true) ?? [];

  const [tab, setTab] = useState(zaps.length > 0 ? "zaps" : "reactions");

  const renderTab = () => {
    switch (tab) {
      case "reposts":
        return <RepostDetails event={event} />;
      case "reactions":
        return <ReactionDetails reactions={reactions} />;
      case "zaps":
        return (
          <>
            {zaps
              .sort((a, b) => b.request.created_at - a.request.created_at)
              .map((zap) => (
                <ZapEvent key={zap.request.id} zap={zap} />
              ))}
          </>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader p={["2", "4"]}>
          <ButtonGroup>
            <Button size="sm" variant={tab === "zaps" ? "solid" : "outline"} onClick={() => setTab("zaps")}>
              Zaps ({zaps.length})
            </Button>
            <Button size="sm" variant={tab === "reactions" ? "solid" : "outline"} onClick={() => setTab("reactions")}>
              Reactions ({reactions.length})
            </Button>
            <Button size="sm" variant={tab === "reposts" ? "solid" : "outline"} onClick={() => setTab("reposts")}>
              Reposts
            </Button>
          </ButtonGroup>
        </ModalHeader>
        <ModalBody px={["2", "4"]} pt="0" pb={["2", "4"]} display="flex" flexDirection="column" gap="2">
          {renderTab()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
