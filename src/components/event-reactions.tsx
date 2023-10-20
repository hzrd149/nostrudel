import { useCallback, useMemo } from "react";
import { Button, ButtonProps, IconButton, Image, useDisclosure } from "@chakra-ui/react";

import { NostrEvent } from "../types/nostr-event";
import useEventReactions from "../hooks/use-event-reactions";
import { DislikeIcon, LikeIcon } from "./icons";
import { draftEventReaction, groupReactions } from "../helpers/nostr/reactions";
import ReactionDetailsModal from "./reaction-details-modal";
import { useSigningContext } from "../providers/signing-provider";
import clientRelaysService from "../services/client-relays";
import NostrPublishAction from "../classes/nostr-publish-action";
import eventReactionsService from "../services/event-reactions";
import { useCurrentAccount } from "../hooks/use-current-account";

export function ReactionIcon({ emoji, url }: { emoji: string; url?: string }) {
  if (emoji === "+") return <LikeIcon />;
  if (emoji === "-") return <DislikeIcon />;
  if (url) return <Image src={url} title={emoji} alt={emoji} w="1em" h="1em" display="inline" />;
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
    <Button leftIcon={<ReactionIcon emoji={emoji} url={url} />} title={emoji} {...props}>
      {count > 1 && count}
    </Button>
  );
}

export default function EventReactionButtons({ event, max }: { event: NostrEvent; max?: number }) {
  const account = useCurrentAccount();
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

  const clamped = Array.from(grouped);
  if (max !== undefined) clamped.length = max;

  return (
    <>
      {clamped.map((group) => (
        <ReactionGroupButton
          key={group.emoji}
          emoji={group.emoji}
          url={group.url}
          count={group.pubkeys.length}
          onClick={() => addReaction(group.emoji, group.url)}
          colorScheme={account && group.pubkeys.includes(account?.pubkey) ? "primary" : undefined}
        />
      ))}
      <Button onClick={detailsModal.onOpen}>Show all</Button>
      {detailsModal.isOpen && <ReactionDetailsModal isOpen onClose={detailsModal.onClose} reactions={reactions} />}
    </>
  );
}
