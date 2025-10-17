import { Flex, Link, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer, naddrEncode, neventEncode } from "nostr-tools/nip19";
import { Link as RouterLink } from "react-router-dom";

import { getThreadReferences, truncatedId } from "../../../../helpers/nostr/event";
import useSingleEvent from "../../../../hooks/use-single-event";
import { CompactNoteContent } from "../../../compact-note-content";
import { ReplyIcon } from "../../../icons";
import UserLink from "../../../user/user-link";

function ReplyToE({ pointer }: { pointer: EventPointer }) {
  const event = useSingleEvent(pointer);

  if (!event) {
    const nevent = neventEncode(pointer);
    return (
      <Text>
        Replying to{" "}
        <Link as={RouterLink} to={`/l/${nevent}`} color="blue.500">
          {truncatedId(nevent)}
        </Link>
      </Text>
    );
  }

  return (
    <>
      <Text>
        Replying to <UserLink pubkey={event.pubkey} fontWeight="bold" />
      </Text>
      <CompactNoteContent event={event} maxLength={96} isTruncated textOnly />
    </>
  );
}
function ReplyToA({ pointer }: { pointer: AddressPointer }) {
  const naddr = naddrEncode(pointer);

  return (
    <Text>
      Replying to{" "}
      <Link as={RouterLink} to={`/l/${naddr}`} color="blue.500">
        {truncatedId(naddr)}
      </Link>
    </Text>
  );
}

export default function ReplyContext({ event }: { event: NostrEvent }) {
  const refs = getThreadReferences(event);
  if (!refs.reply) return null;

  return (
    <Flex gap="2" fontStyle="italic" alignItems="center" whiteSpace="nowrap">
      <ReplyIcon />
      {refs.reply.e ? <ReplyToE pointer={refs.reply.e} /> : <ReplyToA pointer={refs.reply.a} />}
    </Flex>
  );
}
