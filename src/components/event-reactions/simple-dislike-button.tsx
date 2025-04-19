import { ButtonProps } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { groupReactions } from "../../helpers/nostr/reactions";
import useEventReactions from "../../hooks/use-event-reactions";
import { useAddReaction } from "./common-hooks";
import ReactionGroupButton from "./reaction-group-button";

export default function SimpleDislikeButton({
  event,
  ...props
}: Omit<ButtonProps, "children"> & { event: NostrEvent }) {
  const account = useActiveAccount();
  const reactions = useEventReactions(event) ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);

  const addReaction = useAddReaction(event, grouped);
  const group = grouped.find((g) => g.emoji === "-");

  return (
    <ReactionGroupButton
      emoji="-"
      count={group?.pubkeys.length ?? 0}
      onClick={() => addReaction("-")}
      colorScheme={account && group?.pubkeys.includes(account?.pubkey) ? "primary" : undefined}
      {...props}
    />
  );
}
