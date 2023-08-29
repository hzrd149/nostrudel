import { Button, ButtonGroup, ButtonGroupProps, ButtonProps, IconButton, Image, useDisclosure } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import useEventReactions from "../hooks/use-event-reactions";
import { DislikeIcon, LikeIcon } from "./icons";
import { draftEventReaction, groupReactions } from "../helpers/nostr/reactions";
import ReactionDetailsModal from "./reaction-details-modal";
import { useSigningContext } from "../providers/signing-provider";
import clientRelaysService from "../services/client-relays";
import NostrPublishAction from "../classes/nostr-publish-action";
import eventReactionsService from "../services/event-reactions";

export function ReactionIcon({ emoji, url }: { emoji: string; url?: string }) {
  if (emoji === "+") return <LikeIcon />;
  if (emoji === "-") return <DislikeIcon />;
  if (url) return <Image src={url} title={emoji} alt={emoji} />;
  return <span>{emoji}</span>;
}

function ReactionGroupButton({
  emoji,
  url,
  count,
  ...props
}: Omit<ButtonProps, "leftIcon" | "children"> & { emoji: string; count: number; url?: string }) {
  if (count <= 1) {
    return <IconButton icon={<ReactionIcon emoji={emoji} url={url} />} aria-label="Reaction" {...props} />;
  }
  return (
    <Button leftIcon={<ReactionIcon emoji={emoji} url={url} />} {...props}>
      {count > 1 && count}
    </Button>
  );
}

export default function EventReactions({
  event,
  ...props
}: Omit<ButtonGroupProps, "children"> & { event: NostrEvent }) {
  const detailsModal = useDisclosure();
  const reactions = useEventReactions(event.id) ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);
  const { requestSignature } = useSigningContext();

  const addReaction = useCallback(async (emoji = "+", url?: string) => {
    const draft = draftEventReaction(event, emoji, url);

    const signed = await requestSignature(draft);
    if (signed) {
      const writeRelays = clientRelaysService.getWriteUrls();
      new NostrPublishAction("Reaction", writeRelays, signed);
      eventReactionsService.handleEvent(signed);
    }
  }, []);

  if (grouped.length === 0) return null;

  return (
    <>
      <ButtonGroup wrap="wrap" {...props}>
        {grouped.map((group) => (
          <ReactionGroupButton
            key={group.emoji}
            emoji={group.emoji}
            url={group.url}
            count={group.count}
            onClick={() => addReaction(group.emoji, group.url)}
          />
        ))}
        <Button onClick={detailsModal.onOpen}>Show all</Button>
      </ButtonGroup>
      {detailsModal.isOpen && <ReactionDetailsModal isOpen onClose={detailsModal.onClose} reactions={reactions} />}
    </>
  );
}
