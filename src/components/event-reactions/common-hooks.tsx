import { ReactionFactory } from "applesauce-common/factories";
import { Emoji } from "applesauce-common/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { ReactionGroup } from "../../helpers/nostr/reactions";
import { usePublishEvent } from "../../providers/global/publish-provider";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useActiveAccount();
  const publish = usePublishEvent();

  return useCallback(
    async (emoji: string | Emoji = "+") => {
      const group = grouped.find((g) => g.emoji === emoji);
      if (account && group && group.pubkeys.includes(account?.pubkey)) return;

      const draft = await ReactionFactory.create(event, emoji);
      await publish("Reaction", draft);
    },
    [grouped, account, publish, event],
  );
}
