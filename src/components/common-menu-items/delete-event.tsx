import { MenuItem } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import useCurrentAccount from "../../hooks/use-current-account";
import { TrashIcon } from "../icons";

export default function DeleteEventMenuItem({ event, label }: { event: NostrEvent; label?: string }) {
  const account = useCurrentAccount();
  const { deleteEvent } = useDeleteEventContext();

  return (
    account?.pubkey === event.pubkey && (
      <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(event)}>
        {label ?? "Delete Note"}
      </MenuItem>
    )
  );
}
