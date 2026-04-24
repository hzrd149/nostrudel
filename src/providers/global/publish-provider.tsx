import { useToast } from "@chakra-ui/react";
import { addSeenRelay } from "applesauce-core/helpers";
import { mergeRelaySets } from "applesauce-core/helpers";
import { setClient } from "applesauce-core/operations";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { PublishResponse } from "applesauce-relay";
import { nanoid } from "nanoid";
import { EventTemplate, NostrEvent, UnsignedEvent } from "nostr-tools";
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { BehaviorSubject, map, Observable, share } from "rxjs";

import { scanToArray } from "../../helpers/observable";
import { useWriteRelays } from "../../hooks/use-client-relays";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import { NIP_89_CLIENT_APP } from "../../const";
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

function isSignedEvent(event: EventTemplate | UnsignedEvent | NostrEvent): event is NostrEvent {
  return Reflect.has(event, "id") && Reflect.has(event, "sig");
}

export default function PublishProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const [log, setLog] = useState<PublishLogEntry[]>([]);
  const account = useActiveAccount();
  const mailboxes = useUserMailboxes(account?.pubkey);
  const fallbackRelays = useObservableEagerState(localSettings.fallbackRelays);
  const addClientTag = useObservableEagerState(localSettings.addClientTag);
  const writeRelays = useWriteRelays();

  const applyClientTag = useCallback(
    async (event: EventTemplate | UnsignedEvent | NostrEvent) => {
      if (!addClientTag) return event;
      return await setClient(NIP_89_CLIENT_APP.name, NIP_89_CLIENT_APP.address)(event);
    },
    [addClientTag],
  );

  const finalizeDraft = useCallback<PublishContextType["finalizeDraft"]>(
    async (event: EventTemplate | NostrEvent) => {
      if (!account) throw new Error("No active account");

      const draft = await applyClientTag(event);
      return { ...draft, pubkey: account.pubkey };
    },
    [account, applyClientTag],
  );

  const publishEvent = useCallback(
    async (
      label: string,
      event: EventTemplate | UnsignedEvent | NostrEvent,
      additionalRelays?: string[],
      quite = true,
      onlyAdditionalRelays = false,
    ) => {
      try {
        let relays;
        if (onlyAdditionalRelays) relays = mergeRelaySets(additionalRelays ?? []);
        else relays = mergeRelaySets(writeRelays, mailboxes?.outboxes || fallbackRelays, additionalRelays);

        if (!isSignedEvent(event)) {
          // add pubkey to event
          if (!Reflect.has(event, "pubkey")) event = await finalizeDraft(event);
          else event = await applyClientTag(event);
        }

        // sign event
        const signed = isSignedEvent(event) ? event : await account!.signEvent(event);

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
    [toast, setLog, account, applyClientTag, finalizeDraft, writeRelays, mailboxes, fallbackRelays],
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
