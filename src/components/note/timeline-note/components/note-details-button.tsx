import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import InfoCircle from "../../../icons/info-circle";
import useEventReactions from "../../../../hooks/use-event-reactions";
import { getEventUID } from "../../../../helpers/nostr/event";
import useEventZaps from "../../../../hooks/use-event-zaps";

export function NoteDetailsButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const uuid = getEventUID(event);
  const reactions = useEventReactions(uuid) ?? [];
  const zaps = useEventZaps(uuid);

  if (reactions.length === 0 && zaps.length === 0) return null;

  return <IconButton icon={<InfoCircle />} aria-label="Note Details" title="Note Details" {...props} />;
}
