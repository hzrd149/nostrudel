import { Button, ButtonProps } from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";
import { useState } from "react";
import { random } from "../../../helpers/array";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import useEventReactions from "../../../hooks/use-event-reactions";
import { useSigningContext } from "../../../providers/signing-provider";
import clientRelaysService from "../../../services/client-relays";
import eventReactionsService from "../../../services/event-reactions";
import { getEventRelays } from "../../../services/event-relays";
import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { LikeIcon } from "../../icons";
import NostrPublishAction from "../../../classes/nostr-publish-action";

export default function ReactionButton({ note, ...props }: { note: NostrEvent } & Omit<ButtonProps, "children">) {
  const { requestSignature } = useSigningContext();
  const account = useCurrentAccount();

  const reactions = useEventReactions(note.id) ?? [];
  const [loading, setLoading] = useState(false);

  const handleClick = async (reaction = "+") => {
    const eventRelays = getEventRelays(note.id).value;
    const event: DraftNostrEvent = {
      kind: Kind.Reaction,
      content: reaction,
      tags: [
        ["e", note.id, random(eventRelays)],
        ["p", note.pubkey], // TODO: pick a relay for the user
      ],
      created_at: dayjs().unix(),
    };
    const signed = await requestSignature(event);
    if (signed) {
      const writeRelays = clientRelaysService.getWriteUrls();
      new NostrPublishAction("Reaction", writeRelays, signed);
      eventReactionsService.handleEvent(signed);
    }
    setLoading(false);
  };
  const customReaction = () => {
    const input = window.prompt("Enter Reaction");
    if (!input || [...input].length !== 1) return;
    handleClick(input);
  };

  const isLiked = !!account && reactions.some((event) => event.pubkey === account.pubkey);

  return (
    // <Popover placement="bottom" trigger="hover" openDelay={500}>
    //   <PopoverTrigger>
    <Button
      leftIcon={<LikeIcon />}
      aria-label="Like Note"
      title="Like Note"
      onClick={() => handleClick("+")}
      isLoading={loading}
      colorScheme={isLiked ? "brand" : undefined}
      {...props}
    >
      {reactions?.length ?? 0}
    </Button>
    //   </PopoverTrigger>
    //   <PopoverContent>
    //     <PopoverArrow />
    //     <PopoverBody>
    //       <Flex gap="2">
    //         <IconButton icon={<LikeIcon />} onClick={() => handleClick("+")} aria-label="like" />
    //         <IconButton icon={<DislikeIcon />} onClick={() => handleClick("-")} aria-label="dislike" />
    //         <IconButton icon={<span>🤙</span>} onClick={() => handleClick("🤙")} aria-label="different like" />
    //         <IconButton icon={<span>❤️</span>} onClick={() => handleClick("❤️")} aria-label="different like" />
    //         <Button onClick={customReaction}>Custom</Button>
    //       </Flex>
    //     </PopoverBody>
    //   </PopoverContent>
    // </Popover>
  );
}
