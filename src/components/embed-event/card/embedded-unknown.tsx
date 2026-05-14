import { QuestionIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { getHandlerLinkTemplate } from "applesauce-common/helpers";
import { DecodeResult, encodeDecodeResult } from "applesauce-core/helpers";
import { nip19, NostrEvent } from "nostr-tools";
import { useContext, useMemo } from "react";

import { parseCoordinate } from "../../../helpers/nostr/event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";
import { getSharableEventAddress } from "../../../services/relay-hints";
import DebugEventButton from "../../debug-modal/debug-event-button";
import { ExternalLinkIcon } from "../../icons";
import RouterLink from "../../router-link";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserDnsIdentity from "../../user/user-dns-identity";
import UserLink from "../../user/user-link";

export default function EmbeddedUnknown({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const address = useMemo(() => getSharableEventAddress(event), [event]);
  const { openAddress } = useContext(AppHandlerContext);

  const decoded = useMemo((): DecodeResult | undefined => {
    if (!address) return undefined;
    try {
      return nip19.decode(address) as DecodeResult;
    } catch {
      return undefined;
    }
  }, [address]);

  const clientTag = useMemo(() => event.tags.find((t) => t[0] === "client"), [event]);
  const clientName = useMemo(() => clientTag?.[1]?.trim(), [clientTag]);
  const clientPointer = useMemo(() => {
    const value = clientTag?.[2]?.trim();
    if (!value) return undefined;
    try {
      return parseCoordinate(value, true) ?? undefined;
    } catch {
      return undefined;
    }
  }, [clientTag]);

  const handlerApp = useReplaceableEvent(clientPointer);

  const clientLink = useMemo(() => {
    if (!handlerApp || !decoded) return undefined;

    return getHandlerLinkTemplate(handlerApp, "web", decoded.type)?.replace("<bech32>", encodeDecodeResult(decoded));
  }, [handlerApp, decoded]);

  const alt = event.tags.find((t) => t[0] === "alt")?.[1]?.trim();

  const primaryLabel = alt;
  const secondaryLabel = alt && clientName ? `Using ${clientName}` : undefined;

  return (
    <Card overflow="hidden" {...props}>
      <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="md" />
        <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
        <Text color="GrayText" fontSize="sm">
          kind {event.kind}
        </Text>
        <Spacer />
        <Timestamp timestamp={event.created_at} />
        <ButtonGroup size="sm" flexShrink={0}>
          {address && (
            <Button leftIcon={<ExternalLinkIcon />} onClick={() => openAddress(address)}>
              Open
            </Button>
          )}
          {clientLink && (
            <Button as="a" href={clientLink} target="_blank" rel="noopener noreferrer" leftIcon={<ExternalLinkIcon />}>
              Open in {clientName}
            </Button>
          )}
          {address && (
            <IconButton icon={<QuestionIcon />} aria-label="Event details" as={RouterLink} to={`/l/${address}`} />
          )}
        </ButtonGroup>
      </CardHeader>
      <CardBody p="2" pt="2">
        {primaryLabel ? (
          <>
            <Text fontWeight="semibold" noOfLines={3}>
              {primaryLabel}
            </Text>
            {secondaryLabel && (
              <Text fontSize="sm" color="GrayText" fontStyle="italic" noOfLines={2} mt="1">
                {secondaryLabel}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text fontWeight="semibold">Unknown event (kind {event.kind})</Text>
            <Text fontSize="sm" color="GrayText" mt="1">
              {address
                ? "Choose another app to open or interact with this event."
                : "This event has no alt text, client hint, or shareable link."}
            </Text>
          </>
        )}
        {event.content ? (
          <Box whiteSpace="pre-wrap" noOfLines={3} mt="2" fontSize="sm" color="GrayText">
            {event.content}
          </Box>
        ) : null}
      </CardBody>
      <CardFooter p="2" pt="0" display="flex" gap="2" alignItems="center" justifyContent="flex-end">
        <DebugEventButton event={event} variant="outline" size="sm" />
      </CardFooter>
    </Card>
  );
}
