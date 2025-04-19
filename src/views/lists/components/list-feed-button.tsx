import { Button, ButtonProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";

import { NostrEvent } from "nostr-tools";
import { getEventCoordinate } from "../../../helpers/nostr/event";

export default function ListFeedButton({ list, ...props }: { list: NostrEvent } & Omit<ButtonProps, "children">) {
  const shouldShowFeedButton = list.kind === kinds.Followsets || list.kind === kinds.Contacts;

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
