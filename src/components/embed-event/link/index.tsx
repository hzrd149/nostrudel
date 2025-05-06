import { CardProps, Link } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";

import { getArticleTitle } from "../../../helpers/nostr/long-form";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import RouterLink from "../../router-link";
import UserName from "../../user/user-name";
import { DecodeResult } from "nostr-tools/nip19";
import { safeDecode } from "../../../helpers/nip19";
import useSingleEvent from "../../../hooks/use-single-event";
import LoadingNostrLink from "../../loading-nostr-link";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { KindNames } from "../../../helpers/nostr/kinds";

/** A component that renders an inline link to an event */
export function EmbedEventLink({ event }: { event: NostrEvent }) {
  const addr = useShareableEventAddress(event);
  const link = `/l/${addr}`;

  switch (event.kind) {
    case kinds.LongFormArticle:
      return (
        <Link as={RouterLink} to={link}>
          {getArticleTitle(event)} by <UserName pubkey={event.pubkey} />
        </Link>
      );

    default:
      return (
        <Link as={RouterLink} to={link}>
          {KindNames[event.kind] || event.kind} event by <UserName pubkey={event.pubkey} />
        </Link>
      );
  }
}

/** A component that takes a NIP-19 pointer or link and renders a link for the event */
export function EmbedEventPointerLink({
  pointer,
  ...props
}: { pointer: DecodeResult | string } & Omit<CardProps, "children">) {
  const parsedPointer = typeof pointer === "string" ? safeDecode(pointer) : pointer;
  if (!parsedPointer) return null;

  pointer = parsedPointer;

  let event: NostrEvent | undefined = undefined;
  switch (pointer.type) {
    case "note":
      event = useSingleEvent(pointer.data);
      break;
    case "nevent":
      event = useSingleEvent(pointer.data.id, pointer.data.relays);
      break;
    case "naddr":
      event = useReplaceableEvent(pointer.data, pointer.data.relays);
      break;
  }

  if (!event) return <LoadingNostrLink link={pointer} />;
  return <EmbedEventLink event={event} {...props} />;
}
