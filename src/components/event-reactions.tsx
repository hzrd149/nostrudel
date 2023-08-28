import { Flex, FlexProps, Image, useDisclosure } from "@chakra-ui/react";
import { useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import useEventReactions from "../hooks/use-event-reactions";
import { DislikeIcon, LikeIcon } from "./icons";
import { groupReactions } from "../helpers/nostr/reactions";
import ReactionDetailsModal from "./reaction-details-modal";

export function ReactionIcon({ emoji, url, count }: { emoji: string; count: number; url?: string }) {
  const renderIcon = () => {
    if (emoji === "+") return <LikeIcon w="0.8em" h="0.8em" />;
    if (emoji === "-") return <DislikeIcon w="0.8em" h="0.8em" />;
    if (url) return <Image src={url} w="0.8em" h="0.8em" title={emoji} alt={emoji} />;
    return <span>{emoji}</span>;
  };

  if (count > 1) {
    return (
      <>
        {renderIcon()}
        <span>{count}</span>
      </>
    );
  }
  return renderIcon();
}

export default function EventReactions({ event, ...props }: Omit<FlexProps, "children"> & { event: NostrEvent }) {
  const detailsModal = useDisclosure();
  const reactions = useEventReactions(event.id) ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);

  if (grouped.length === 0) return null;

  return (
    <>
      <Flex
        maxW="lg"
        overflow="hidden"
        gap="1"
        alignItems="center"
        cursor="pointer"
        onClick={detailsModal.onOpen}
        {...props}
      >
        {grouped.map((group) => (
          <ReactionIcon key={group.emoji} emoji={group.emoji} url={group.url} count={group.count} />
        ))}
      </Flex>
      {detailsModal.isOpen && <ReactionDetailsModal isOpen onClose={detailsModal.onClose} reactions={reactions} />}
    </>
  );
}
