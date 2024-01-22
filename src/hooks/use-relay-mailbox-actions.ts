import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";

import NostrPublishAction from "../classes/nostr-publish-action";
import { RelayMode } from "../classes/relay";
import { useSigningContext } from "../providers/global/signing-provider";
import clientRelaysService from "../services/client-relays";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import useCurrentAccount from "./use-current-account";
import useUserMailboxes from "./use-user-mailboxes";
import { addRelayModeToMailbox, removeRelayModeFromMailbox } from "../helpers/nostr/mailbox";

export default function useRelayMailboxActions(relay: string) {
  const toast = useToast();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();
  const { event, inbox, outbox } = useUserMailboxes(account?.pubkey, { alwaysRequest: true }) || {};

  const addMode = useCallback(
    async (mode: RelayMode) => {
      try {
        let draft = addRelayModeToMailbox(event ?? undefined, relay, mode);
        const signed = await requestSignature(draft);
        new NostrPublishAction("Mute", clientRelaysService.outbox.urls, signed);
        replaceableEventLoaderService.handleEvent(signed);
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [requestSignature, event],
  );
  const removeMode = useCallback(
    async (mode: RelayMode) => {
      try {
        let draft = removeRelayModeFromMailbox(event ?? undefined, relay, mode);
        const signed = await requestSignature(draft);
        new NostrPublishAction("Mute", clientRelaysService.outbox.urls, signed);
        replaceableEventLoaderService.handleEvent(signed);
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [requestSignature, event],
  );

  return { inbox, outbox, addMode, removeMode };
}
