import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { EventTemplate, NostrEvent, kinds } from "nostr-tools";

import { useSigningContext } from "./signing-provider";
import { DraftNostrEvent } from "../../types/nostr-event";
import PublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import RelaySet from "../../classes/relay-set";
import { getAllRelayHints, isReplaceable } from "../../helpers/nostr/event";
import replaceableEventsService from "../../services/replaceable-events";
import eventExistsService from "../../services/event-exists";
import eventReactionsService from "../../services/event-reactions";
import { localRelay } from "../../services/local-relay";
import { handleEventFromRelay } from "../../services/event-relays";
import deleteEventService from "../../services/delete-events";
import userMailboxesService from "../../services/user-mailboxes";

type PublishContextType = {
  log: PublishAction[];
  publishEvent(
    label: string,
    event: EventTemplate | NostrEvent,
    additionalRelays: Iterable<string> | undefined,
    quite: false,
    onlyAdditionalRelays: false,
  ): Promise<PublishAction>;
  publishEvent(
    label: string,
    event: EventTemplate | NostrEvent,
    additionalRelays: Iterable<string> | undefined,
    quite: false,
    onlyAdditionalRelays?: boolean,
  ): Promise<PublishAction>;
  publishEvent(
    label: string,
    event: EventTemplate | NostrEvent,
    additionalRelays?: Iterable<string> | undefined,
    quite?: boolean,
    onlyAdditionalRelays?: boolean,
  ): Promise<PublishAction | undefined>;
};
export const PublishContext = createContext<PublishContextType>({
  log: [],
  publishEvent: async () => {
    throw new Error("Publish provider not setup");
  },
});

export function usePublishEvent() {
  return useContext(PublishContext).publishEvent;
}

export default function PublishProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const [log, setLog] = useState<PublishAction[]>([]);
  const { requestSignature } = useSigningContext();

  const publishEvent = useCallback(
    async (
      label: string,
      event: DraftNostrEvent | NostrEvent,
      additionalRelays?: Iterable<string>,
      quite = true,
      onlyAdditionalRelays = false,
    ) => {
      try {
        let relays;
        if (onlyAdditionalRelays) {
          relays = RelaySet.from(additionalRelays);
        } else {
          relays = RelaySet.from(
            clientRelaysService.writeRelays.value,
            clientRelaysService.outbox,
            additionalRelays,
            getAllRelayHints(event),
          );
        }

        let signed: NostrEvent;
        if (!Object.hasOwn(event, "sig")) {
          let draft: EventTemplate = event as EventTemplate;
          draft = userMailboxesService.addPubkeyRelayHints(draft);
          signed = await requestSignature(draft);
        } else signed = event as NostrEvent;

        const pub = new PublishAction(label, relays, signed);
        setLog((arr) => arr.concat(pub));

        pub.onResult.subscribe(({ relay, success }) => {
          if (success) handleEventFromRelay(relay, signed);
        });

        // send it to the local relay
        if (localRelay) localRelay.publish(signed);

        // pass it to other services
        eventExistsService.handleEvent(signed);
        if (isReplaceable(signed.kind)) replaceableEventsService.handleEvent(signed);
        if (signed.kind === kinds.Reaction) eventReactionsService.handleEvent(signed);
        if (signed.kind === kinds.EventDeletion) deleteEventService.handleEvent(signed);
        return pub;
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
        if (!quite) throw e;
      }
    },
    [toast, setLog, requestSignature],
  ) as PublishContextType["publishEvent"];

  const context = useMemo<PublishContextType>(
    () => ({
      publishEvent,
      log,
    }),
    [publishEvent, log],
  );

  return <PublishContext.Provider value={context}>{children}</PublishContext.Provider>;
}
