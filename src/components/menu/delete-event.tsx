import { MenuItem } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { useDeleteEventContext } from "../../providers/route/delete-event-provider";
import { TrashIcon } from "../icons";

export default function DeleteEventMenuItem({ event, label = "Delete Event" }: { event: NostrEvent; label?: string }) {
  const account = useActiveAccount();
  const { deleteEvent } = useDeleteEventContext();

  return (
    account?.pubkey === event.pubkey && (
      <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(event)}>
        {label}
      </MenuItem>
    )
  );
}
