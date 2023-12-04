import { useRef } from "react";
import { Card, CardBody, CardHeader, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatarLink from "../../../components/user-avatar-link";
import UserLink from "../../../components/user-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import StarRating from "../../../components/star-rating";
import { safeJson } from "../../../helpers/parse";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { NoteContents } from "../../../components/note/text-note-contents";
import { Metadata } from "./relay-card";
import { getEventUID } from "../../../helpers/nostr/events";
import Timestamp from "../../../components/timestamp";

export default function RelayReviewNote({ event, hideUrl }: { event: NostrEvent; hideUrl?: boolean }) {
  const ratingJson = event.tags.find((t) => t[0] === "l" && t[3])?.[3];
  const rating = ratingJson ? (safeJson(ratingJson, undefined) as { quality: number } | undefined) : undefined;

  const url = event.tags.find((t) => t[0] === "r")?.[1];

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Card variant="outline" ref={ref}>
      <CardHeader display="flex" gap="2" px="2" pt="2" pb="0">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <Timestamp ml="auto" timestamp={event.created_at} />
      </CardHeader>
      <CardBody p="2">
        {!hideUrl && url && (
          <Metadata name="URL">
            <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`}>
              {url}
            </Link>
          </Metadata>
        )}
        {rating && <StarRating quality={rating.quality} color="yellow.400" mb="1" />}
        <NoteContents event={event} />
      </CardBody>
    </Card>
  );
}
