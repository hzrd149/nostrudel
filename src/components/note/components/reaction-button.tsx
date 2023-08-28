import { useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonProps,
  Flex,
  HStack,
  IconButton,
  IconButtonProps,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";

import { useCurrentAccount } from "../../../hooks/use-current-account";
import useEventReactions from "../../../hooks/use-event-reactions";
import { useSigningContext } from "../../../providers/signing-provider";
import clientRelaysService from "../../../services/client-relays";
import eventReactionsService from "../../../services/event-reactions";
import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { AddReactionIcon } from "../../icons";
import ReactionPicker from "../../reaction-picker";

export default function ReactionButton({
  event: note,
  ...props
}: { event: NostrEvent } & Omit<ButtonProps, "children">) {
  const { requestSignature } = useSigningContext();
  const account = useCurrentAccount();
  const reactions = useEventReactions(note.id) ?? [];

  const addReaction = async (emoji = "+", url?: string) => {
    const event: DraftNostrEvent = {
      kind: Kind.Reaction,
      content: url ? ":" + emoji + ":" : emoji,
      tags: [
        ["e", note.id],
        ["p", note.pubkey], // TODO: pick a relay for the user
      ],
      created_at: dayjs().unix(),
    };

    if (url) event.tags.push(["emoji", emoji, url]);

    const signed = await requestSignature(event);
    if (signed) {
      const writeRelays = clientRelaysService.getWriteUrls();
      new NostrPublishAction("Reaction", writeRelays, signed);
      eventReactionsService.handleEvent(signed);
    }
  };

  return (
    <Popover isLazy>
      <PopoverTrigger>
        <IconButton icon={<AddReactionIcon />} aria-label="Add Reaction" {...props}>
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
