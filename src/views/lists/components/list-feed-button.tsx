import { Button, ButtonProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Kind } from "nostr-tools";

import { NostrEvent } from "../../../types/nostr-event";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { PEOPLE_LIST_KIND } from "../../../helpers/nostr/lists";

export default function ListFeedButton({ list, ...props }: { list: NostrEvent } & Omit<ButtonProps, "children">) {
  const shouldShowFeedButton = list.kind === PEOPLE_LIST_KIND || list.kind === Kind.Contacts;

  if (!shouldShowFeedButton) return null;

  return (
    <Button
      as={RouterLink}
      to={{ pathname: "/", search: new URLSearchParams({ people: getEventCoordinate(list) }).toString() }}
      {...props}
    >
      View Feed
    </Button>
  );
}
