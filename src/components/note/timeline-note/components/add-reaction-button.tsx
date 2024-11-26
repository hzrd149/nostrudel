import { useState } from "react";
import {
  ButtonProps,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useBoolean,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import useEventReactions from "../../../../hooks/use-event-reactions";
import { AddReactionIcon } from "../../../icons";
import ReactionPicker from "../../../reaction-picker";
import { draftEventReaction } from "../../../../helpers/nostr/reactions";
import { getEventUID } from "../../../../helpers/nostr/event";
import { usePublishEvent } from "../../../../providers/global/publish-provider";

export default function AddReactionButton({
  event,
  portal = false,
  ...props
}: { event: NostrEvent; portal?: boolean } & Omit<ButtonProps, "children">) {
  const publish = usePublishEvent();
  const reactions = useEventReactions(event) ?? [];
  const [popover, setPopover] = useBoolean();

  const [loading, setLoading] = useState(false);
  const addReaction = async (emoji = "+", url?: string) => {
    setLoading(true);
    const draft = draftEventReaction(event, emoji, url);
    await publish("Reaction", draft);
    setPopover.off();
    setLoading(false);
  };

  const content = (
    <PopoverContent>
      <PopoverArrow />
      <PopoverBody>
        <ReactionPicker onSelect={addReaction} />
      </PopoverBody>
    </PopoverContent>
  );

  return (
    <Popover isLazy isOpen={popover} onOpen={setPopover.on} onClose={setPopover.off}>
      <PopoverTrigger>
        <IconButton
          icon={<AddReactionIcon />}
          aria-label="Add Reaction"
          title="Add Reaction"
          isLoading={loading}
          {...props}
        >
          {reactions?.length ?? 0}
        </IconButton>
      </PopoverTrigger>
      {portal ? <Portal>{content}</Portal> : content}
    </Popover>
  );
}
