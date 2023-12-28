import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";

import { ReactionGroup, draftEventReaction } from "../../helpers/nostr/reactions";
import useCurrentAccount from "../../hooks/use-current-account";
import { useSigningContext } from "../../providers/global/signing-provider";
import { NostrEvent } from "../../types/nostr-event";
import clientRelaysService from "../../services/client-relays";
import NostrPublishAction from "../../classes/nostr-publish-action";
import eventReactionsService from "../../services/event-reactions";

export function useAddReaction(event: NostrEvent, grouped: ReactionGroup[]) {
  const account = useCurrentAccount();
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  return useCallback(
    async (emoji = "+", url?: string) => {
      try {
        const group = grouped.find((g) => g.emoji === emoji);
        if (account && group && group.pubkeys.includes(account?.pubkey)) return;

        const draft = draftEventReaction(event, emoji, url);

        const signed = await requestSignature(draft);
        if (signed) {
          const writeRelays = clientRelaysService.getWriteUrls();
          new NostrPublishAction("Reaction", writeRelays, signed);
          eventReactionsService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [grouped, account, toast, requestSignature],
  );
}
