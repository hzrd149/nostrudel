import { useCallback } from "react";

import { ReactionGroup, draftEventReaction } from "../../helpers/nostr/reactions";
import useCurrentAccount from "../../hooks/use-current-account";
import { NostrEvent } from "../../types/nostr-event";
import { usePublishEvent } from "../../providers/global/publish-provider";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useCurrentAccount();
  const publish = usePublishEvent();

  return useCallback(
    async (emoji = "+", url?: string) => {
      const group = grouped.find((g) => g.emoji === emoji);
      if (account && group && group.pubkeys.includes(account?.pubkey)) return;

      const draft = draftEventReaction(event, emoji, url);

      publish("Reaction", draft);
    },
    [grouped, account, publish],
  );
}
