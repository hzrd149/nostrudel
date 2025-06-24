import { Emoji } from "applesauce-core/helpers";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { ReactionGroup } from "../../helpers/nostr/reactions";
import { usePublishEvent } from "../../providers/global/publish-provider";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const factory = useEventFactory();

  return useCallback(
    async (emoji: string | Emoji = "+") => {
      const group = grouped.find((g) => g.emoji === emoji);
      if (account && group && group.pubkeys.includes(account?.pubkey)) return;

      const draft = await factory.reaction(event, emoji);
      const signed = await factory.sign(draft);
      await publish("Reaction", signed);
    },
    [grouped, account, publish, event, factory],
  );
}
