import dayjs from "dayjs";
import { useRef } from "react";
import { Card, CardBody, CardHeader, Text } from "@chakra-ui/react";

import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import StarRating from "../../../components/star-rating";
import { safeJson } from "../../../helpers/parse";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { NoteContents } from "../../../components/note/note-contents";
import { Metadata } from "./relay-card";

export default function RelayReviewNote({ event, hideUrl }: { event: NostrEvent; hideUrl?: boolean }) {
  const ratingJson = event.tags.find((t) => t[0] === "l" && t[3])?.[3];
  const rating = ratingJson ? (safeJson(ratingJson, undefined) as { quality: number } | undefined) : undefined;

  const url = event.tags.find((t) => t[0] === "r")?.[1];

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <Card variant="outline" ref={ref}>
      <CardHeader display="flex" gap="2" px="2" pt="2" pb="0">
        <UserAvatarLink pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <Text ml="auto">{dayjs.unix(event.created_at).fromNow()}</Text>
      </CardHeader>
      <CardBody p="2">
        {!hideUrl && <Metadata name="URL">{url}</Metadata>}
        {rating && <StarRating quality={rating.quality} color="yellow.400" mb="1" />}
        <NoteContents event={event} />
      </CardBody>
    </Card>
  );
}
