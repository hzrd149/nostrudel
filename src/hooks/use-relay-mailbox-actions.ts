import { useCallback } from "react";

import { RelayMode } from "../classes/relay";
import useCurrentAccount from "./use-current-account";
import useUserMailboxes from "./use-user-mailboxes";
import { addRelayModeToMailbox, removeRelayModeFromMailbox } from "../helpers/nostr/mailbox";
import { usePublishEvent } from "../providers/global/publish-provider";

export default function useRelayMailboxActions(relay: string) {
  const publish = usePublishEvent();
  const account = useCurrentAccount();
  const { event, inbox, outbox } = useUserMailboxes(account?.pubkey, { alwaysRequest: true }) || {};

  const addMode = useCallback(
    async (mode: RelayMode) => {
      let draft = addRelayModeToMailbox(event ?? undefined, relay, mode);
      await publish("Add Relay", draft);
    },
    [publish, event],
  );
  const removeMode = useCallback(
    async (mode: RelayMode) => {
      let draft = removeRelayModeFromMailbox(event ?? undefined, relay, mode);
      await publish("Remove Relay", draft);
    },
    [publish, event],
  );

  return { inbox, outbox, addMode, removeMode };
}
