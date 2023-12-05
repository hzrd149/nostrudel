import {
  ButtonProps,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  useBoolean,
  useToast,
} from "@chakra-ui/react";

import useEventReactions from "../../../hooks/use-event-reactions";
import { useSigningContext } from "../../../providers/signing-provider";
import clientRelaysService from "../../../services/client-relays";
import eventReactionsService from "../../../services/event-reactions";
import { NostrEvent } from "../../../types/nostr-event";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { AddReactionIcon } from "../../icons";
import ReactionPicker from "../../reaction-picker";
import { draftEventReaction } from "../../../helpers/nostr/reactions";
import { getEventUID } from "../../../helpers/nostr/events";
import { useState } from "react";

export default function ReactionButton({ event, ...props }: { event: NostrEvent } & Omit<ButtonProps, "children">) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const reactions = useEventReactions(getEventUID(event)) ?? [];
  const [popover, setPopover] = useBoolean();

  const [loading, setLoading] = useState(false);
  const addReaction = async (emoji = "+", url?: string) => {
    setLoading(true);
    try {
      const draft = draftEventReaction(event, emoji, url);

      const signed = await requestSignature(draft);
      if (signed) {
        const writeRelays = clientRelaysService.getWriteUrls();
        new NostrPublishAction("Reaction", writeRelays, signed);
        eventReactionsService.handleEvent(signed);
        setPopover.off();
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

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
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          <ReactionPicker onSelect={addReaction} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
