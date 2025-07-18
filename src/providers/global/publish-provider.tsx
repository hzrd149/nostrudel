import { useToast } from "@chakra-ui/react";
import { addSeenRelay, mergeRelaySets } from "applesauce-core/helpers";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";
import { nanoid } from "nanoid";
import { EventTemplate, NostrEvent, UnsignedEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { BehaviorSubject, map, Observable, share } from "rxjs";

import { scanToArray } from "../../helpers/observable";
import { useWriteRelays } from "../../hooks/use-client-relays";
import { useUserOutbox } from "../../hooks/use-user-mailboxes";
import { writeEvent } from "../../services/event-cache";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";

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
  const outbox = useUserOutbox(account?.pubkey);
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
        else relays = mergeRelaySets(writeRelays, outbox, additionalRelays);

        // add pubkey to event
        if (!Reflect.has(event, "pubkey")) event = await finalizeDraft(event);

        // sign event
        const signed = !Reflect.has(event, "sig") ? await account!.signEvent(event) : (event as NostrEvent);

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
    [toast, setLog, account, finalizeDraft, outbox, writeRelays],
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
