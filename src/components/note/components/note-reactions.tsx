import { ButtonGroup, ButtonGroupProps, Divider } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import ReactionButton from "./reaction-button";
import EventReactionButtons from "../../event-reactions";
import useEventReactions from "../../../hooks/use-event-reactions";

export default function NoteReactions({ event, ...props }: Omit<ButtonGroupProps, "children"> & { event: NostrEvent }) {
  const reactions = useEventReactions(event.id) ?? [];

  return (
    <ButtonGroup spacing="1" {...props}>
      <ReactionButton event={event} />
      {reactions.length > 0 && (
        <>
          <Divider orientation="vertical" h="1.5rem" />
          <EventReactionButtons event={event} />
        </>
      )}
    </ButtonGroup>
  );
}
