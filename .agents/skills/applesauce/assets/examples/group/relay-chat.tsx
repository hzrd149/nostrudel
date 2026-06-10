/**
 * Group chat functionality using relay-based messaging
 * @tags nip-29, nip-42, group, chat, messaging
 * @related group/groups, group/threads
 */
import { GroupMessageFactory } from "applesauce-common/factories";
import { castUser } from "applesauce-common/casts";
import { decodeGroupPointer, groupMessageEvents, GroupPointer } from "applesauce-common/helpers";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { getDisplayName, getProfilePicture, getSeenRelays, mergeRelaySets } from "applesauce-core/helpers";
import { NostrEvent } from "applesauce-core/helpers/event";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$, useObservableEagerMemo } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { npubEncode } from "nostr-tools/nip19";
import { useCallback, useEffect, useMemo, useState } from "react";
import GroupPicker from "../../components/group-picker";

const eventStore = new EventStore();
const signer = new ExtensionSigner();
const pool = new RelayPool();

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

function ChatMessageGroup({ messages }: { messages: NostrEvent[] }) {
  const profile = use$(
    () => eventStore.profile({ pubkey: messages[0].pubkey, relays: mergeRelaySets(getSeenRelays(messages[0])) }),
    [messages[0].pubkey],
  );

  const time = messages[0].created_at;

  return (
    <div className="chat chat-start">
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img
            alt={getDisplayName(profile)}
            src={getProfilePicture(profile, `https://robohash.org/${messages[0].pubkey}`)}
          />
        </div>
      </div>
      <div className="chat-header">
        {getDisplayName(profile)}
        <time className="text-xs opacity-50">{new Date(time * 1000).toLocaleString()}</time>
      </div>
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <div className="chat-bubble">{message.content}</div>
        ))}
      </div>
    </div>
  );
}

function ChatLog({ pointer }: { pointer: GroupPointer }) {
  const messages = use$(
    () =>
      pool
        .relay(pointer.relay)
        .subscription({ kinds: [9], "#h": [pointer.id], limit: 100 }, { reconnect: true })
        .pipe(
          // map to store
          mapEventsToStore(eventStore),
          // map to timeline
          mapEventsToTimeline(),
        ),
    [pointer.relay, pointer?.id],
  );

  const groups = groupMessageEvents(messages ? Array.from(messages).reverse() : []).reverse();

  return (
    <div
      className="flex gap-2 flex-col-reverse overflow-y-auto overflow-x-hidden border p-4 border-base-300 rounded-lg"
      style={{ height: "calc(100vh - 12rem - 4rem)" }}
    >
      {groups.map((group) => (
        <ChatMessageGroup key={group[0].id} messages={group} />
      ))}
    </div>
  );
}

function SendMessageForm({ pointer }: { pointer: GroupPointer }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Clear the message when the pointer changes
  useEffect(() => setMessage(""), [pointer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !pointer) return;

    setSending(true);
    try {
      // Create and sign a group message
      const signed = await GroupMessageFactory.create(pointer, message).sign(signer);
      // Publish the message to the relay
      const response = await pool.relay(pointer.relay).publish(signed);
      // Throw an error if the message was rejected
      if (!response.ok) throw new Error(response.message);
      // Clear the form
      setMessage("");
    } catch (err) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={sending}
        placeholder="Type your message..."
        className="input input-bordered grow"
      />
      <button type="submit" disabled={sending || !message.trim()} className="btn btn-primary">
        {sending ? <span className="loading loading-spinner loading-sm"></span> : "Send"}
      </button>
    </form>
  );
}

export default function RelayGroupExample() {
  const [identifier, setIdentifier] = useState("");
  const [pointer, setPointer] = useState<GroupPointer>();
  const [pubkey, setPubkey] = useState<string | null>(null);
  const user = useMemo(() => (pubkey ? castUser(pubkey, eventStore) : undefined), [pubkey]);

  const setGroup = useCallback(
    (identifier: string) => {
      try {
        setIdentifier(identifier);
        setPointer(decodeGroupPointer(identifier) ?? undefined);
      } catch (error) {}
    },
    [setIdentifier, setPointer],
  );

  // Subscribe to authentication state for the current relay
  const authRequiredForRead = useObservableEagerMemo(
    () => (pointer ? pool.relay(pointer.relay).authRequiredForRead$ : undefined),
    [pointer?.relay],
  );
  const authenticated = useObservableEagerMemo(
    () => (pointer ? pool.relay(pointer.relay).authenticated$ : undefined),
    [pointer?.relay],
  );
  const challenge = useObservableEagerMemo(
    () => (pointer ? pool.relay(pointer.relay).challenge$ : undefined),
    [pointer?.relay],
  );

  const needsAuth = !!authRequiredForRead;
  const authAvailable = !!challenge && !authRequiredForRead;

  const handleSignIn = useCallback(async () => {
    const pubkey = await signer.getPublicKey();
    setPubkey(pubkey);
  }, [user]);

  // Handle authentication with extension signer
  const handleAuthenticate = useCallback(async () => {
    if (authenticated || !pointer) return;

    try {
      const signer = new ExtensionSigner();

      // get the users pubkey
      setPubkey(await signer.getPublicKey());

      // Authenticate with the relay
      await pool
        .relay(pointer.relay)
        .authenticate(signer)
        .then((response) => console.log("Authentication response:", response))
        .catch((error) => console.error("Authentication error:", error));
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }, [pointer, needsAuth, authenticated]);

  const npub = pubkey && npubEncode(pubkey);

  return (
    <div className="container mx-auto p-2 h-full overflow-hidden">
      <div className="flex w-full mb-4 items-center gap-2">
        <GroupPicker identifier={identifier} setIdentifier={setGroup} user={user} />
        {!pubkey && (
          <button className="btn" onClick={handleSignIn}>
            Sign in
          </button>
        )}
        {pointer && authenticated && npub && <div className="badge badge-success">Authenticated</div>}
      </div>

      {pointer && needsAuth && !authenticated && (
        <div className="mb-4">
          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold">Authentication Required</h3>
              <div className="text-xs">This relay requires authentication to read group messages.</div>
              {challenge && <div className="text-xs mt-1">Challenge received: {challenge.slice(0, 10)}...</div>}
            </div>
            <button className="btn btn-sm btn-primary" onClick={handleAuthenticate}>
              Authenticate
            </button>
          </div>
        </div>
      )}

      {pointer && authAvailable && !authenticated && (
        <div className="mb-4">
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold">Authentication Available</h3>
              <div className="text-xs">This relay supports authentication but it's not required to read messages.</div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={handleAuthenticate}>
              Authenticate
            </button>
          </div>
        </div>
      )}

      {pointer && <ChatLog pointer={pointer} />}
      {pointer && <SendMessageForm pointer={pointer} />}
    </div>
  );
}
