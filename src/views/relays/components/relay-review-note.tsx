import { Card, CardBody, CardHeader, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { safeParse } from "applesauce-core/helpers/json";

import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import StarRating from "../../../components/star-rating";
import { NostrEvent } from "nostr-tools";
import { Metadata } from "./relay-card";
import Timestamp from "../../../components/timestamp";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

export default function RelayReviewNote({ event, hideUrl }: { event: NostrEvent; hideUrl?: boolean }) {
  const ratingJson = event.tags.find((t) => t[0] === "l" && t[3])?.[3];
  const rating = ratingJson ? safeParse<{ quality: number }>(ratingJson) : undefined;

  const url = event.tags.find((t) => t[0] === "r")?.[1];

  const ref = useEventIntersectionRef(event);

  return (
    <Card variant="outline" ref={ref}>
      <CardHeader display="flex" gap="2" px="2" pt="2" pb="0">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
        <Timestamp ml="auto" timestamp={event.created_at} />
      </CardHeader>
      <CardBody p="2">
        {!hideUrl && url && (
          <Metadata name="URL">
            <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`}>
              {url}
            </Link>
          </Metadata>
        )}
        {rating && <StarRating quality={rating.quality} color="yellow.400" mb="1" />}
        <TextNoteContents event={event} />
      </CardBody>
    </Card>
  );
}
