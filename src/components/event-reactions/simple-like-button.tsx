import { useMemo } from "react";

import { NostrEvent } from "../../types/nostr-event";
import useEventReactions from "../../hooks/use-event-reactions";
import { groupReactions } from "../../helpers/nostr/reactions";
import { useCurrentAccount } from "../../hooks/use-current-account";
import ReactionGroupButton from "./reaction-group-button";
import { useAddReaction } from "./common-hooks";
import { ButtonProps } from "@chakra-ui/react";

export default function SimpleLikeButton({ event, ...props }: Omit<ButtonProps, "children"> & { event: NostrEvent }) {
  const account = useCurrentAccount();
  const reactions = useEventReactions(event.id) ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);

  const addReaction = useAddReaction(event, grouped);
  const group = grouped.find((g) => g.emoji === "+");

  return (
    <ReactionGroupButton
      emoji="+"
      count={group?.pubkeys.length ?? 0}
      onClick={() => addReaction("+")}
      colorScheme={account && group?.pubkeys.includes(account?.pubkey) ? "primary" : undefined}
      {...props}
    />
  );
}
