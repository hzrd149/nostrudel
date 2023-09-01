import { useMemo } from "react";
import { Card, CardBody, CardHeader, CardProps, Flex, Heading, Image, LinkBox, LinkOverlay } from "@chakra-ui/react";

import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { useRelaySelectionRelays } from "../../../providers/relay-selection-provider";
import replaceableEventLoaderService from "../../../services/replaceable-event-requester";
import useSubject from "../../../hooks/use-subject";
import { NoteContents } from "../../../components/note/note-contents";
import { isATag } from "../../../types/nostr-event";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";

export const STREAMER_CARDS_TYPE = 17777;
export const STREAMER_CARD_TYPE = 37777;

function useStreamerCardsCords(pubkey: string, relays: string[]) {
  const sub = useMemo(
    () => replaceableEventLoaderService.requestEvent(relays, STREAMER_CARDS_TYPE, pubkey),
    [pubkey, relays.join("|")],
  );
  const streamerCards = useSubject(sub);

  return streamerCards?.tags.filter(isATag) ?? [];
}

function StreamerCard({ cord, relay, ...props }: { cord: string; relay?: string } & CardProps) {
  const contextRelays = useRelaySelectionRelays();
  const readRelays = useReadRelayUrls(relay ? [...contextRelays, relay] : contextRelays);

  const card = useReplaceableEvent(cord, readRelays);
  if (!card || card.kind !== STREAMER_CARD_TYPE) return null;

  const title = card.tags.find((t) => t[0] === "title")?.[1];
  const image = card.tags.find((t) => t[0] === "image")?.[1];
  const link = card.tags.find((t) => t[0] === "r")?.[1];

  return (
    <Card as={LinkBox} variant="outline" {...props}>
      {image && <Image src={image} />}
      {title && (
        <CardHeader p="2">
          <Heading size="md">{title}</Heading>
        </CardHeader>
      )}
      <CardBody p="2">
        <NoteContents event={card} />
        {link && (
          <LinkOverlay isExternal href={link} color="blue.500">
            {!image && link}
          </LinkOverlay>
        )}
      </CardBody>
    </Card>
  );
}

export default function StreamerCards({ pubkey }: { pubkey: string }) {
  const contextRelays = useRelaySelectionRelays();
  const readRelays = useReadRelayUrls(contextRelays);

  const cardCords = useStreamerCardsCords(pubkey, readRelays);

  return (
    <Flex wrap="wrap" gap="2">
      {cardCords.map(([_, cord, relay]) => (
        <StreamerCard key={cord} cord={cord} relay={relay} maxW="lg" />
      ))}
    </Flex>
  );
}
