import { Card, CardBody, CardHeader, CardProps, Heading, Image, LinkBox, LinkOverlay } from "@chakra-ui/react";
import { getEventUID, getTagValue } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import OpenGraphCard from "../../../components/open-graph/open-graph-card";
import { StreamCardsQuery } from "../../../models/stream";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";

export const STREAMER_CARDS_TYPE = 17777;
export const STREAMER_CARD_TYPE = 37777;

function StreamerCard({ card, ...props }: { card: NostrEvent } & CardProps) {
  if (!card || card.kind !== STREAMER_CARD_TYPE) return null;

  const title = getTagValue(card, "title");
  const image = getTagValue(card, "image");
  const link = getTagValue(card, "r");

  if (!card.content && !image && link) {
    return <OpenGraphCard url={new URL(link)} />;
  }

  return (
    <Card as={LinkBox} variant="outline" {...props}>
      {image && <Image src={image} />}
      {title && (
        <CardHeader p="2">
          <Heading size="md">{title}</Heading>
        </CardHeader>
      )}
      {card.content && (
        <CardBody p="2">
          <TextNoteContents event={card} />
        </CardBody>
      )}
      {link && (
        <LinkOverlay isExternal href={link} color="blue.500">
          {!image && link}
        </LinkOverlay>
      )}
    </Card>
  );
}

export default function StreamerCards({ pubkey, ...props }: Omit<CardProps, "children"> & { pubkey: string }) {
  const contextRelays = useAdditionalRelayContext();

  const cards = useEventModel(StreamCardsQuery, [{ pubkey, relays: contextRelays }]);

  return <>{cards?.map((card) => <StreamerCard key={getEventUID(card)} card={card} {...props} />)}</>;
}
