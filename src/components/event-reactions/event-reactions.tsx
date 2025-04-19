import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";

import { groupReactions } from "../../helpers/nostr/reactions";
import useEventReactions from "../../hooks/use-event-reactions";
import { useAddReaction } from "./common-hooks";
import ReactionGroupButton from "./reaction-group-button";

export default function EventReactionButtons({ event, max }: { event: NostrEvent; max?: number }) {
  const account = useActiveAccount();
  const reactions = useEventReactions(event) ?? [];
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);

  const addReaction = useAddReaction(event, grouped);
  const [loading, setLoading] = useState<string>();

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
          isLoading={loading === group.emoji}
          onClick={() => {
            setLoading(group.emoji);
            if (group.url) {
              addReaction({ shortcode: group.emoji, url: group.url }).finally(() => setLoading(undefined));
            } else {
              addReaction(group.emoji).finally(() => setLoading(undefined));
            }
          }}
          colorScheme={account && group.pubkeys.includes(account?.pubkey) ? "primary" : undefined}
        />
      ))}
    </>
  );
}
