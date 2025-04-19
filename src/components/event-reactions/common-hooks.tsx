import { useCallback } from "react";
import { Emoji } from "applesauce-core/helpers";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { ReactionGroup } from "../../helpers/nostr/reactions";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { useSigningContext } from "../../providers/global/signing-provider";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useActiveAccount();
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
