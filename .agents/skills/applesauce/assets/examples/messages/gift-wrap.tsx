/**
 * Send and receive encrypted gift-wrapped direct messages
 * @tags nip-17, nip-44, nip-59, messages, gift-wrap, encryption, dm
 * @related messages/legacy, gift-wrap/timeline
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { SendWrappedMessage } from "applesauce-actions/actions";
import { castUser, User } from "applesauce-common/casts";
import {
  getConversationIdentifierFromMessage,
  getConversationParticipants,
  getGiftWrapRumor,
  getGiftWrapSeal,
  groupMessageEvents,
  persistEncryptedContent,
  Rumor,
  unlockGiftWrap,
} from "applesauce-common/helpers";
import { GiftWrapsModel, WrappedMessagesGroup, WrappedMessagesModel } from "applesauce-common/models";
import { defined, EventStore, mapEventsToStore } from "applesauce-core";
import { persistEventsToCache, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool, SyncDirection } from "applesauce-relay";
import { type ISigner, ExtensionSigner } from "applesauce-signers";
import clsx from "clsx";
import { addEvents, openDB } from "nostr-idb";
import { kinds, NostrEvent } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, catchError, EMPTY, map, tap } from "rxjs";

// Import helper components
import LoginView from "../../components/login-view";
import UnlockView from "../../components/unlock-view";

import SecureStorage from "../../extra/encrypted-storage";

const EXPIRATIONS: Record<string, number> = {
  "30m": 60 * 30,
  "1d": 60 * 60 * 24,
  "1w": 60 * 60 * 24 * 7,
  "2w": 60 * 60 * 24 * 14,
  "1y": 60 * 60 * 24 * 365,
};

const storage$ = new BehaviorSubject<SecureStorage | null>(null);

// Subjects for holding the signer and user
const signer$ = new BehaviorSubject<ISigner | undefined>(undefined);
const user$ = new BehaviorSubject<User | undefined>(undefined);

// Setup event store and relay connection pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Setup loaders for event store to load profiles
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

// Setup an action runner for running pre-built actions
const actions = new ActionRunner(eventStore, new ProxySigner(signer$), async (event, relays) => {
  if (!relays) relays = await user$.value?.inboxes$.$first(1000, undefined);
  if (!relays) throw new Error("No relays found");

  await pool.publish(relays, event);
});

// Persist encrypted content to the storage backend
persistEncryptedContent(eventStore, storage$.pipe(defined()));

// Setup a local event cache
const cache = await openDB();

// Save all new events to the cache
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Create a in-memory set of failed gift wraps
const failed$ = new BehaviorSubject<string[]>(JSON.parse(localStorage.getItem("failed-gift-wraps") ?? "[]"));
failed$.subscribe((failed) => localStorage.setItem("failed-gift-wraps", JSON.stringify(failed)));

// Debug modal
const debug$ = new BehaviorSubject<NostrEvent | null>(null);

function RelayItem({ relay }: { relay: string }) {
  const inst = useMemo(() => pool.relay(relay), [relay]);
  const supported = use$(inst.supported$);
  const icon = use$(inst.icon$);
  const information = use$(inst.information$);
  const name = information?.name || new URL(relay).hostname;

  return (
    <div className="flex gap-2 items-center">
      <img src={icon} className="w-6 h-6 rounded-full" />
      <p
        className={clsx("font-mono", {
          "decoration-line-through": !supported?.includes(77),
        })}
      >
        {name}
      </p>
    </div>
  );
}

function InlineRelayList({ relays }: { relays: string[] }) {
  return (
    <div className="flex gap-2 items-center">
      {relays.map((relay) => (
        <RelayItem key={relay} relay={relay} />
      ))}
    </div>
  );
}

function MessageForm({ conversation }: { conversation: string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expiration, setExpiration] = useState<string>();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);

      // Create and send gift wrapped message to all participants using action runner
      await actions.run(SendWrappedMessage, getConversationParticipants(conversation), message.trim(), {
        expiration: expiration ? unixNow() + EXPIRATIONS[expiration] : undefined,
      });

      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
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
        className="input input-bordered flex-grow"
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

function MessageGroup({ messages, pubkey }: { messages: Rumor[]; pubkey: string }) {
  const isOwn = messages[0].pubkey === pubkey;
  const time = messages[0].created_at;

  return (
    <div className={`chat ${isOwn ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src={`https://robohash.org/${messages[0].pubkey}`} />
        </div>
      </div>
      <div className="chat-header">{npubEncode(messages[0].pubkey).slice(0, 8)}...</div>
      <div className={`flex flex-col-reverse gap-2 overflow-hidden ${isOwn ? "items-end" : "items-start"}`}>
        {messages.map((message) => (
          <div key={message.id} className="chat-bubble whitespace-pre-line">
            {message.content}{" "}
            <a
              href="#"
              className="text-xs text-base-content/50"
              onClick={(e) => {
                e.preventDefault();
                const gift = eventStore
                  .getTimeline({ kinds: [kinds.GiftWrap] })
                  .find((gift) => getGiftWrapRumor(gift)?.id === message.id);
                if (gift) debug$.next(gift);
              }}
            >
              raw
            </a>
          </div>
        ))}
      </div>
      <div className="chat-footer opacity-50">
        <time className="text-xs">{new Date(time * 1000).toLocaleString()}</time>
      </div>
    </div>
  );
}

function ConversationView({ pubkey, conversation }: { pubkey: string; conversation: string }) {
  // Get all messages for this conversation
  const messages = use$(
    () => eventStore.model(WrappedMessagesGroup, pubkey, getConversationParticipants(conversation)),
    [pubkey, conversation],
  );

  // Group the messages using the helper
  const messageGroups = useMemo(() => {
    if (!messages) return [];
    return groupMessageEvents(messages, 5 * 60); // 5 minute buffer between groups
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden w-full">
      <div className="flex flex-col-reverse flex-1 overflow-y-auto overflow-x-hidden gap-4">
        {messageGroups.map((group) => (
          <MessageGroup key={group[0].id} messages={group} pubkey={pubkey} />
        ))}
      </div>

      <div className="flex items-center gap-2 w-full mt-4">
        <MessageForm conversation={conversation} />
      </div>
    </div>
  );
}

function ConversationList({
  messages,
  pubkey,
  onSelect,
  selected,
}: {
  messages: Rumor[];
  pubkey: string;
  onSelect: (id: string) => void;
  selected?: string;
}) {
  // Group messages by conversation and sort by latest message date
  const conversations = useMemo(() => {
    const convMap = new Map<string, { participants: string[]; lastMessage: Rumor }>();

    // Group messages by conversation
    for (const message of messages) {
      const convId = getConversationIdentifierFromMessage(message);
      const participants = getConversationParticipants(message);

      if (!convMap.has(convId) || convMap.get(convId)!.lastMessage.created_at < message.created_at) {
        convMap.set(convId, {
          participants,
          lastMessage: message,
        });
      }
    }

    // Convert to array and sort by latest message date
    return Array.from(convMap.entries()).sort((a, b) => b[1].lastMessage.created_at - a[1].lastMessage.created_at);
  }, [messages]);

  return (
    <ul className="list bg-base-100 rounded-box">
      {conversations.map(([convId, { participants, lastMessage }]) => (
        <li
          key={convId}
          className={`list-row cursor-pointer hover:bg-base-200 ${selected === convId ? "bg-base-200" : ""}`}
          onClick={() => onSelect(convId)}
        >
          <div className="avatar-group -space-x-4 rtl:space-x-reverse">
            {participants
              .filter((p) => p !== pubkey)
              .map((p) => (
                <div key={p} className="avatar">
                  <div className="w-8 h-8">
                    <img src={`https://robohash.org/${p}`} />
                  </div>
                </div>
              ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              {participants
                .filter((p) => p !== pubkey)
                .map((p) => npubEncode(p).slice(0, 8))
                .join(", ")}
            </div>
            <div className="text-xs font-semibold opacity-50">
              {new Date(lastMessage.created_at * 1000).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function GiftWrapDebugModal({ gift }: { gift: NostrEvent }) {
  const rumor = useMemo(() => getGiftWrapRumor(gift), [gift]);
  const seal = useMemo(() => getGiftWrapSeal(gift), [gift]);

  return (
    <>
      <h3 className="text-lg font-bold">Rumor</h3>
      <pre>
        <code>{JSON.stringify(rumor, null, 2)}</code>
      </pre>
      <h3 className="text-lg font-bold">Seal</h3>
      <pre>
        <code>{JSON.stringify(seal, null, 2)}</code>
      </pre>
      <h3 className="text-lg font-bold">Gift wrap</h3>
      <pre>
        <code>{JSON.stringify(gift, null, 2)}</code>
      </pre>
    </>
  );
}

function HomeView({ user }: { user: User }) {
  const [selectedConversation, setSelectedConversation] = useState<string>();
  const signer = use$(signer$);
  const debug = use$(debug$);
  const [since, setSince] = useState<number>(() => unixNow() - EXPIRATIONS["2w"]); // 2 weeks ago
  const [synced, setSynced] = useState(0);
  const failed = use$(failed$);

  // Subscribe to the users nip-17 inboxes
  const dmRelays = use$(user.directMessageRelays$);

  // Negentropy sync NIP-17 direct messages since timestamp
  use$(
    () =>
      // If no DM relays, return EMPTY
      !dmRelays
        ? EMPTY
        : pool
            .sync(
              dmRelays,
              eventStore,
              {
                kinds: [kinds.GiftWrap],
                "#p": [user.pubkey],
                since,
              },
              SyncDirection.RECEIVE,
            )
            .pipe(
              tap(() => setSynced((v) => v + 1)),
              // Ignore errors
              catchError(() => EMPTY),
            ),
    // Resync when user, since, or DM relays change
    [user.pubkey, since, dmRelays?.join(",")],
  );

  // Live subscription for new gift-wrapped messages (only future messages)
  use$(
    () =>
      !dmRelays
        ? EMPTY
        : pool
            .subscription(dmRelays, {
              kinds: [kinds.GiftWrap],
              "#p": [user.pubkey],
              since: unixNow() - 60 * 60 * 24 * 7, // 1 week ago
            })
            .pipe(
              mapEventsToStore(eventStore),
              // Ignore errors
              catchError(() => EMPTY),
            ),
    [user.pubkey, dmRelays?.join(",")],
  );

  // Select all unlocked gift wraps
  const messages = use$(() => eventStore.model(WrappedMessagesModel, user.pubkey), [user.pubkey]);

  const [unlocking, setUnlocking] = useState(false);
  const locked = use$(
    () =>
      eventStore
        .model(GiftWrapsModel, user.pubkey, false)
        // Filter out the failed gift wraps
        .pipe(map((events) => events.filter((e) => !failed.includes(e.id)))),
    [user.pubkey, failed.length],
  );

  const unlock = async () => {
    if (!locked || !signer) return;
    setUnlocking(true);
    for (const gift of locked) {
      // Ignore previously failed gift wraps
      if (failed$.value.includes(gift.id)) continue;

      try {
        await unlockGiftWrap(gift, signer);
      } catch (error) {
        // Ignore errors
        failed$.next([...failed$.value, gift.id]);
      }
    }
    setUnlocking(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSince(Math.floor(date.getTime() / 1000));
  };

  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split("T")[0];
  };

  // Control the debug modal
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!modal.current) return;
    if (debug && !modal.current.open) modal.current.showModal();
    else if (!debug && modal.current.open) modal.current.close();
  }, [debug]);

  return (
    <div className="flex bg-base-200 overflow-hidden h-screen">
      <div className="w-sm bg-base-100 p-2 overflow-y-auto flex flex-col gap-2 shrink-0">
        <div className="flex flex-col gap-2 p-2 border-b border-base-300">
          {dmRelays ? <InlineRelayList relays={dmRelays} /> : <p className="text-error">No DM relays found</p>}

          <div className="flex items-center gap-2 whitespace-pre">
            <label className="text-xs">Sync from:</label>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={formatDateForInput(since)}
              onChange={handleDateChange}
            />
          </div>

          <div className="text-xs opacity-70">
            {synced} events synced • {messages ? [...messages].length : 0} unlocked • {locked?.length ?? 0} locked •{" "}
            {failed.length} failed
          </div>
        </div>

        {locked && locked.length > 0 && (
          <button className="btn btn-primary mx-auto" onClick={unlock} disabled={unlocking}>
            {unlocking ? "Unlocking..." : `Unlock pending (${locked.length})`}
          </button>
        )}

        {messages && (
          <ConversationList
            messages={[...messages]}
            pubkey={user.pubkey}
            onSelect={setSelectedConversation}
            selected={selectedConversation}
          />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedConversation ? (
          <ConversationView pubkey={user.pubkey} conversation={selectedConversation} />
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Gift wrap debug modal */}
      <dialog id="debug-modal" className="modal" ref={modal}>
        <div className="modal-box w-full max-w-6xl">{debug && <GiftWrapDebugModal gift={debug} />}</div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

function App() {
  const storage = use$(storage$);
  const signer = use$(signer$);
  const user = use$(user$);

  const handleUnlock = async (storage: SecureStorage, pubkey?: string) => {
    storage$.next(storage);

    if (pubkey) {
      user$.next(castUser(pubkey, eventStore));
      signer$.next(new ExtensionSigner());
    }
  };

  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    user$.next(castUser(pubkey, eventStore));
    if (storage) await storage.setItem("pubkey", pubkey);
  };

  // Show unlock view if storage is not initialized
  if (!storage) return <UnlockView onUnlock={handleUnlock} />;

  // Show login view if not logged in
  if (!signer || !user) return <LoginView onLogin={handleLogin} />;

  // Show main inbox view when both storage and login are ready
  return <HomeView user={user} />;
}

export default App;
