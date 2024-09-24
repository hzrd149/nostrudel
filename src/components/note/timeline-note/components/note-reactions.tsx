import { ButtonGroup, ButtonGroupProps, Divider } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import AddReactionButton from "./add-reaction-button";
import EventReactionButtons from "../../../event-reactions/event-reactions";
import { useBreakpointValue } from "../../../../providers/global/breakpoint-provider";
import useEventReactions from "../../../../hooks/use-event-reactions";

export default function NoteReactions({ event, ...props }: Omit<ButtonGroupProps, "children"> & { event: NostrEvent }) {
  const reactions = useEventReactions(event) ?? [];
  const max = useBreakpointValue({ base: undefined, md: 4 });

  return (
    <ButtonGroup spacing="1" {...props}>
      <AddReactionButton event={event} />
      {reactions.length > 0 && (
        <>
          <Divider orientation="vertical" h="1.5rem" />
          <EventReactionButtons event={event} max={max} />
        </>
      )}
    </ButtonGroup>
  );
}
