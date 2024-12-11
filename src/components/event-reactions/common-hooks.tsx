import { useCallback } from "react";
import { Emoji } from "applesauce-core/helpers";

import { ReactionGroup } from "../../helpers/nostr/reactions";
import useCurrentAccount from "../../hooks/use-current-account";
import { NostrEvent } from "../../types/nostr-event";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { useEventFactory } from "applesauce-react/hooks";
import { useSigningContext } from "../../providers/global/signing-provider";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useCurrentAccount();
  const publish = usePublishEvent();
  const factory = useEventFactory()!;
  const { requestSignature } = useSigningContext();

  return useCallback(
    async (emoji: string | Emoji = "+") => {
      const group = grouped.find((g) => g.emoji === emoji);
      if (account && group && group.pubkeys.includes(account?.pubkey)) return;

      const draft = await factory.reaction(event, emoji);
      const signed = await requestSignature(draft);
      await publish("Reaction", signed);
    },
    [grouped, account, publish, event, factory, requestSignature],
  );
}
