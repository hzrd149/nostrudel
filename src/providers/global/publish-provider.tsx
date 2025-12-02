import { useToast } from "@chakra-ui/react";
import { addSeenRelay, mergeRelaySets } from "applesauce-core/helpers";
import { useActiveAccount, useEventFactory, useObservableEagerState } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";
import { nanoid } from "nanoid";
import { EventTemplate, NostrEvent, UnsignedEvent, verifyEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { BehaviorSubject, map, Observable, share } from "rxjs";

import { scanToArray } from "../../helpers/observable";
import { useWriteRelays } from "../../hooks/use-client-relays";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import { writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import localSettings from "../../services/preferences";

export type PublishResults = { packets: PublishResponse[]; relays: Record<string, PublishResponse> };

export class PublishLogEntry {
  public id = nanoid();

  public done = false;
  public publish$: Observable<PublishResponse>;
  public results$ = new BehaviorSubject<PublishResponse[]>([]);
  public relayStatus$: Observable<Record<string, PublishResponse | undefined>>;

  constructor(
    public label: string,
    public event: NostrEvent,
    public relays: string[],
  ) {
    // Build a custom publish observable so the responses can be streamed back to the UI
    this.publish$ = pool.event(relays, event).pipe(share());

    // Save all results to an array
    this.publish$.pipe(scanToArray()).subscribe((r) => this.results$.next(r));

    // Create a directory of relay statuses
    this.relayStatus$ = this.results$.pipe(
      map((results) => Object.fromEntries(relays.map((relay) => [relay, results.find((r) => r.from === relay)]))),
    );

    // Update the event store and add seen relays
    this.publish$.subscribe({
      next: (result) => {
        if (result.ok) {
          addSeenRelay(event, result.from);
          eventStore.update(event);
        }
      },
      complete: () => {
        this.done = true;
      },
    });
  }
}

type PublishContextType = {
  log: PublishLogEntry[];
  finalizeDraft(draft: EventTemplate | NostrEvent): Promise<UnsignedEvent>;
  publishEvent(
    label: string,
    event: EventTemplate | UnsignedEvent | NostrEvent,
    additionalRelays: Iterable<string> | undefined,
    quite: false,
    onlyAdditionalRelays: false,
  ): Promise<PublishLogEntry>;
  publishEvent(
    label: string,
    event: EventTemplate | UnsignedEvent | NostrEvent,
    additionalRelays: Iterable<string> | undefined,
    quite: false,
    onlyAdditionalRelays?: boolean,
  ): Promise<PublishLogEntry>;
  publishEvent(
    label: string,
    event: EventTemplate | UnsignedEvent | NostrEvent,
    additionalRelays?: Iterable<string> | undefined,
    quite?: boolean,
    onlyAdditionalRelays?: boolean,
  ): Promise<PublishLogEntry | undefined>;
};
export const PublishContext = createContext<PublishContextType>({
  log: [],
  finalizeDraft: () => {
    throw new Error("Publish provider not setup");
  },
  publishEvent: async () => {
    throw new Error("Publish provider not setup");
  },
});

export function usePublishEvent() {
  return useContext(PublishContext).publishEvent;
}
export function useFinalizeDraft() {
  return useContext(PublishContext).finalizeDraft;
}

export default function PublishProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const [log, setLog] = useState<PublishLogEntry[]>([]);
  const account = useActiveAccount();
  const mailboxes = useUserMailboxes(account?.pubkey);
  const fallbackRelays = useObservableEagerState(localSettings.fallbackRelays);
  const writeRelays = useWriteRelays();
  const factory = useEventFactory();

  const finalizeDraft = useCallback<PublishContextType["finalizeDraft"]>(
    (event: EventTemplate | NostrEvent) => factory.stamp(event),
    [factory],
  );

  const publishEvent = useCallback(
    async (
      label: string,
      event: EventTemplate | NostrEvent,
      additionalRelays?: string[],
      quite = true,
      onlyAdditionalRelays = false,
    ) => {
      try {
        let relays;
        if (onlyAdditionalRelays) relays = mergeRelaySets(additionalRelays ?? []);
        else relays = mergeRelaySets(writeRelays, mailboxes?.outboxes || fallbackRelays, additionalRelays);

        // Finalize and sign with the active account to avoid publishing pre-signed or mismatched events
        const unsigned = await finalizeDraft(event);
        if (unsigned.pubkey !== account!.pubkey) throw new Error("Event pubkey does not match active account");

        // Always sign ourselves; never forward a caller-supplied signature
        const signed = await account!.signEvent(unsigned);
        if (!verifyEvent(signed)) throw new Error("Signed event failed verification");

        const entry = new PublishLogEntry(label, signed, [...relays]);

        setLog((arr) => arr.concat(entry));

        await writeEvent(signed);

        // add it to the event store
        eventStore.add(signed);

        return entry;
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
        if (!quite) throw e;
      }
    },
    [toast, setLog, account, finalizeDraft, writeRelays, mailboxes, fallbackRelays],
  ) as PublishContextType["publishEvent"];

  const context = useMemo<PublishContextType>(
    () => ({
      publishEvent,
      finalizeDraft,
      log,
    }),
    [publishEvent, finalizeDraft, log],
  );

  return <PublishContext.Provider value={context}>{children}</PublishContext.Provider>;
}
