import { NostrEvent, nip19 } from "nostr-tools";
import { Flex, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { getThreadReferences, truncatedId } from "../../../../helpers/nostr/event";
import UserLink from "../../../user/user-link";
import useSingleEvent from "../../../../hooks/use-single-event";
import { CompactNoteContent } from "../../../compact-note-content";
import { ReplyIcon } from "../../../icons";

function ReplyToE({ pointer }: { pointer: nip19.EventPointer }) {
  const event = useSingleEvent(pointer.id, pointer.relays);

  if (!event) {
    const nevent = nip19.neventEncode(pointer);
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
function ReplyToA({ pointer }: { pointer: nip19.AddressPointer }) {
  const naddr = nip19.naddrEncode(pointer);

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
