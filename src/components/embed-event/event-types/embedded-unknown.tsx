import { useContext, useMemo } from "react";
import { Box, Button, ButtonGroup, Card, CardBody, CardHeader, CardProps, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import UserDnsIdentity from "../../user/user-dns-identity";
import { renderGenericUrl, renderImageUrl, renderVideoUrl } from "../../content/links";
import Timestamp from "../../timestamp";
import { ExternalLinkIcon } from "../../icons";
import { renderAudioUrl } from "../../content/links/audio";
import DebugEventButton from "../../debug-modal/debug-event-button";
import DebugEventTags from "../../debug-modal/event-tags";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";
import { getSharableEventAddress } from "../../../services/event-relay-hint";

export default function EmbeddedUnknown({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const address = useMemo(() => getSharableEventAddress(event), [event]);
  const { openAddress } = useContext(AppHandlerContext);

  const alt = event.tags.find((t) => t[0] === "alt")?.[1];

  return (
    <>
      <Card {...props}>
        <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="md" />
          <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
          <Text>kind: {event.kind}</Text>
          <Timestamp timestamp={event.created_at} />
          <ButtonGroup ml="auto">
            {address && (
              <Button size="sm" leftIcon={<ExternalLinkIcon />} onClick={() => openAddress(address)}>
                Open
              </Button>
            )}
            <DebugEventButton event={event} size="sm" variant="outline" />
          </ButtonGroup>
        </CardHeader>
        <CardBody p="2">
          {alt && (
            <Text isTruncated fontStyle="italic">
              {alt}
            </Text>
          )}
          <Box whiteSpace="pre-wrap" noOfLines={3}>
            {event.content}
          </Box>
          {event.tags.length > 0 && <DebugEventTags event={event} />}
        </CardBody>
      </Card>
    </>
  );
}
