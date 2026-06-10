/**
 * Send and receive legacy encrypted direct messages (NIP-04)
 * @tags messages, legacy, nip-04, dm
 * @related messages/gift-wrap
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { SendLegacyMessage } from "applesauce-actions/actions";
import { defined, EventStore, mapEventsToStore } from "applesauce-core";
import {
  getDisplayName,
  getProfilePicture,
  getTagValue,
  lockEncryptedContent,
  persistEventsToCache,
  unixNow,
} from "applesauce-core/helpers";
import { CacheRequest } from "applesauce-loaders";
import { createEventLoaderForStore, createTimelineLoader } from "applesauce-loaders/loaders";
import { use$, useObservableEagerMemo } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { type ISigner, ExtensionSigner } from "applesauce-signers";
import localforage from "localforage";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BehaviorSubject } from "rxjs";

// Import helper components
import LoginView from "../../components/login-view";
import RelayPicker from "../../components/relay-picker";
import UnlockView from "../../components/unlock-view";

import { persistEncryptedContent, unlockLegacyMessage } from "applesauce-common/helpers";
import { EncryptedContentModel, ProfileModel } from "applesauce-core/models";
import SecureStorage from "../../extra/encrypted-storage";

const EXPIRATIONS: Record<string, number> = {
  "30m": 60 * 30,
  "1d": 60 * 60 * 24,
  "1w": 60 * 60 * 24 * 7,
  "2w": 60 * 60 * 24 * 14,
  "1y": 60 * 60 * 24 * 365,
};

const storage$ = new BehaviorSubject<SecureStorage | null>(null);
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const eventStore = new EventStore();
const pool = new RelayPool();
const actions = new ActionRunner(eventStore, new ProxySigner(signer$.pipe(defined())));

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Persist encrypted content
persistEncryptedContent(eventStore, storage$.pipe(defined()));

// Setup a local event cache
const cache = await openDB();
const cacheRequest: CacheRequest = (filters) => getEventsForFilters(cache, filters);

// Save all new events to the cache
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

function ContactItem({ contactPubkey, onSelect }: { contactPubkey: string; onSelect: (pubkey: string) => void }) {
  const profile = use$(() => eventStore.model(ProfileModel, contactPubkey), [contactPubkey]);
  const displayName = getDisplayName(profile, contactPubkey.slice(0, 8) + "...");
  const avatar = getProfilePicture(profile, `https://robohash.org/${contactPubkey}.png`);

  return (
    <li
      className="list-row cursor-pointer hover:bg-base-200 transition-colors rounded-box"
      onClick={() => onSelect(contactPubkey)}
    >
      <div>
        <img className="size-10 rounded-box" src={avatar} alt={displayName} />
      </div>
      <div className="flex-1">
        <div>{displayName}</div>
        <div className="text-xs font-semibold opacity-60 break-all">{npubEncode(contactPubkey)}</div>
      </div>
    </li>
  );
}

function ContactList({
  events,
  pubkey,
  onSelect,
}: {
  events: NostrEvent[];
  pubkey: string;
  onSelect: (pubkey: string) => void;
}) {
  const contacts = useMemo(() => {
    return events
      .filter((e) => e.kind === 4)
      .map((event) => {
        const sender = event.pubkey;
        const recipient = getTagValue(event, "p");
        if (recipient === pubkey) return sender;
        else if (sender === pubkey) return recipient;
        else return undefined;
      })
      .filter((p) => p !== undefined)
      .reduce((arr, p) => {
        if (arr.includes(p)) return arr;
        else return [...arr, p];
      }, [] as string[]);
  }, [events, pubkey]);

  return (
    <ul className="list bg-base-100 rounded-box shadow-none">
      {contacts.map((contactPubkey) => (
        <ContactItem key={contactPubkey} contactPubkey={contactPubkey} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function Message({ pubkey, message, signer }: { pubkey: string; message: NostrEvent; signer: ISigner }) {
  const sender = message.pubkey;
  const content = use$(() => eventStore.model(EncryptedContentModel, message), [message.id]);

  const decrypt = async () => {
    await unlockLegacyMessage(message, pubkey, signer);
  };

  return (
    <div>
      <span className={`font-bold ${sender === pubkey ? "text-primary" : "text-secondary"}`}>{sender.slice(0, 8)}</span>
      :{" "}
      {content || (
        <button className="btn btn-link" onClick={decrypt}>
          decrypt
        </button>
      )}
    </div>
  );
}

function DirectMessageForm({ corraspondant, relay }: { corraspondant: string; relay: string }) {
  const [message, setMessage] = useState("");
  const [expiration, setExpiration] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);

      await actions
        .exec(SendLegacyMessage, corraspondant, message, {
          expiration: expiration ? unixNow() + EXPIRATIONS[expiration] : undefined,
        })
        .forEach((signed) => pool.publish([relay], signed));

      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    setSending(false);
  };

  const toggleExpiration = () => {
    const arr = Object.keys(EXPIRATIONS);
    const next = expiration ? arr[arr.indexOf(expiration) + 1] : arr[0];
    setExpiration(next);
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 w-full">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={sending}
        placeholder="Type your message..."
        className="input input-bordered grow"
      />
      <button type="button" className="btn btn-ghost" title="Set expiration" onClick={toggleExpiration}>
        {expiration ? expiration : "--"}
      </button>
      <button type="submit" className="btn btn-primary" disabled={sending}>
        Send
      </button>
    </form>
  );
}

function DirectMessageView({
  pubkey,
  correspondent,
  relay,
  signer,
}: {
  pubkey: string;
  correspondent: string;
  relay: string;
  signer: ISigner;
}) {
  const filters = useMemo<Filter[]>(
    () => [
      { kinds: [4], authors: [correspondent], "#p": [pubkey] },
      { kinds: [4], authors: [pubkey], "#p": [correspondent] },
    ],
    [correspondent, pubkey],
  );

  const loader$ = useMemo(
    () => createTimelineLoader(pool, [relay], filters, { eventStore, cache: cacheRequest }),
    [relay, correspondent, pubkey],
  );
  useEffect(() => {
    loader$().subscribe();
  }, [loader$]);

  // Create subscription for new events
  use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [kinds.EncryptedDirectMessage], "#p": [pubkey] })
        .pipe(mapEventsToStore(eventStore)),
    [relay, pubkey],
  );

  const loadMore = useCallback(() => {
    loader$().subscribe();
  }, [loader$]);

  const messages = useObservableEagerMemo(() => eventStore.timeline(filters), [filters]);

  const decryptAll = async () => {
    try {
      for (const message of messages) await unlockLegacyMessage(message, pubkey, signer);
    } catch (error) {
      // Stop of first error
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden w-full">
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col-reverse gap-2">
        {messages.map((message) => (
          <Message key={message.id} pubkey={pubkey} message={message} signer={signer} />
        ))}

        <button onClick={loadMore} className="btn btn-primary mx-auto">
          Load more
        </button>
      </div>

      <div className="flex items-center gap-2 w-full mt-4">
        <DirectMessageForm corraspondant={correspondent} relay={relay} />

        <button className="btn" onClick={decryptAll}>
          Decrypt all
        </button>
      </div>
    </div>
  );
}

function HomeView({ pubkey, signer }: { pubkey: string; signer: ISigner }) {
  const [relay, setRelay] = useState<string>("wss://relay.damus.io/");
  const [selected, setSelected] = useState<string | null>(null);

  const filters = useMemo<Filter[]>(
    () => [
      { kinds: [4], authors: [pubkey] },
      { kinds: [4], "#p": [pubkey] },
    ],
    [pubkey],
  );

  // Create a loader and start it
  const timeline = useMemo(() => createTimelineLoader(pool, [relay], filters, { eventStore }), [relay]);
  useEffect(() => {
    // Load first page of events
    timeline().subscribe();
  }, [timeline]);

  const loadMore = useCallback(() => {
    timeline().subscribe();
  }, [timeline]);

  // Get all events from the event store
  const events = useObservableEagerMemo(() => eventStore.timeline(filters), [filters]);

  const clearCache = useCallback(() => {
    localforage.clear();
    const events = eventStore.getByFilters({ kinds: [4] });
    for (const event of events) lockEncryptedContent(event);
  }, [eventStore]);

  return (
    <div className="flex bg-base-200 overflow-hidden h-screen">
      <div className="w-sm bg-base-100 p-2 overflow-y-auto flex flex-col gap-2 shrink-0 shadow-none">
        <div className="flex gap-2 w-full">
          <RelayPicker className="w-full" value={relay} onChange={setRelay} />
          <button className="btn" onClick={clearCache}>
            Clear
          </button>
        </div>
        <ContactList events={events} pubkey={pubkey} onSelect={setSelected} />
        <button onClick={loadMore} className="btn btn-primary mx-auto" onScroll={loadMore}>
          Load more
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <DirectMessageView pubkey={pubkey} correspondent={selected} relay={relay} signer={signer} />
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const storage = use$(storage$);
  const signer = use$(signer$);
  const pubkey = use$(pubkey$);

  const handleUnlock = async (storage: SecureStorage, pubkey?: string) => {
    storage$.next(storage);

    if (pubkey) {
      pubkey$.next(pubkey);
      signer$.next(new ExtensionSigner());
    }
  };
  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
    if (storage) await storage.setItem("pubkey", pubkey);
  };

  // Show unlock view if storage is not initialized
  if (!storage) return <UnlockView onUnlock={handleUnlock} />;

  // Show login view if not logged in
  if (!signer || !pubkey) return <LoginView onLogin={handleLogin} />;

  // Show main app view when both storage and login are ready
  return <HomeView pubkey={pubkey} signer={signer} />;
}

export default App;
