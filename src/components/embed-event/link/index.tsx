import { getArticleTitle } from "applesauce-common/helpers";
import { Link, LinkProps } from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

import { getDecodedEventPointer, safeDecode } from "../../../helpers/nip19";
import { KindNames } from "../../../helpers/nostr/kinds";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import useEvent from "../../../hooks/use-event";
import LoadingNostrLink from "../../loading-nostr-link";
import RouterLink from "../../router-link";
import UserName from "../../user/user-name";

/** A component that renders an inline link to an event */
export function EmbedEventLink({ event, ...props }: { event: NostrEvent } & Omit<LinkProps, "children" | "href">) {
  const addr = useShareableEventAddress(event);
  const link = `/l/${addr}`;

  switch (event.kind) {
    case kinds.LongFormArticle:
      return (
        <Link {...props} as={RouterLink} to={link}>
          {getArticleTitle(event)} by <UserName pubkey={event.pubkey} />
        </Link>
      );

    default:
      return (
        <Link {...props} as={RouterLink} to={link}>
          {KindNames[event.kind] || event.kind} event by <UserName pubkey={event.pubkey} />
        </Link>
      );
  }
}

/** A component that takes a NIP-19 pointer or link and renders a link for the event */
export function EmbedEventPointerLink({
  pointer,
  ...props
}: { pointer: DecodeResult | string } & Omit<LinkProps, "children" | "href">) {
  const parsedPointer = typeof pointer === "string" ? safeDecode(pointer) : pointer;
  const event = useEvent(parsedPointer ? getDecodedEventPointer(parsedPointer) : undefined);
  if (!parsedPointer) return null;

  if (!event) return <LoadingNostrLink link={parsedPointer} />;
  return <EmbedEventLink event={event} {...props} />;
}
