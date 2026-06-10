/**
 * A personal notes app built on NIP-17 direct messages
 * @tags nip-17, nip-44, nip-59, notes, encryption, self-messaging, nip-77, negentropy
 * @related messages/gift-wrap
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { ReplyToWrappedMessage, SendWrappedMessage } from "applesauce-actions/actions";
import { castUser, User } from "applesauce-common/casts";
import {
  getConversationParticipants,
  getRumorGiftWraps,
  getWrappedMessageParent,
  persistEncryptedContent,
  Rumor,
  unlockGiftWrap,
} from "applesauce-common/helpers";
import { GiftWrapsModel, WrappedMessagesModel } from "applesauce-common/models";
import { defined, EventStore } from "applesauce-core";
import { getExpirationTimestamp, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool, SyncDirection } from "applesauce-relay";
import { type ISigner, ExtensionSigner } from "applesauce-signers";
import clsx from "clsx";
import { kinds } from "nostr-tools";
import { useMemo, useState } from "react";
import { BehaviorSubject, catchError, EMPTY, map, tap } from "rxjs";

// Import helper components
import LoginView from "../../components/login-view";
import UnlockView from "../../components/unlock-view";

import SecureStorage from "../../extra/encrypted-storage";

// Expiration times for notes and comments (in seconds from creation)
// NIP-17 recommends shorter expirations for gift-wrapped messages to reduce relay storage
const EXPIRATIONS: Record<string, number> = {
  "1 hour": 60 * 60,
  "6 hours": 60 * 60 * 6,
  "1 day": 60 * 60 * 24,
  "3 days": 60 * 60 * 24 * 3,
  "1 week": 60 * 60 * 24 * 7,
  "2 weeks": 60 * 60 * 24 * 14,
  "1 month": 60 * 60 * 24 * 30,
};

const storage$ = new BehaviorSubject<SecureStorage | null>(null);

// Subjects for holding the signer and user
const signer$ = new BehaviorSubject<ISigner | undefined>(undefined);
const user$ = new BehaviorSubject<User | undefined>(undefined);

// Global expiration setting for all notes and comments (defaults to 3 days)
const expiration$ = new BehaviorSubject<string>(localStorage.getItem("note-expiration") ?? "3 days");
expiration$.subscribe((exp) => localStorage.setItem("note-expiration", exp));

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

// Create a in-memory set of failed gift wraps
const failed$ = new BehaviorSubject<string[]>(JSON.parse(localStorage.getItem("failed-gift-wraps") ?? "[]"));
failed$.subscribe((failed) => localStorage.setItem("failed-gift-wraps", JSON.stringify(failed)));

// Format expiration timestamp for display
function formatExpiration(expirationTimestamp: number | undefined): string | null {
  if (!expirationTimestamp) return null;

  const now = unixNow();
  const timeLeft = expirationTimestamp - now;

  if (timeLeft <= 0) return "Expired";

  const minutes = Math.floor(timeLeft / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Expires in ${days}d`;
  if (hours > 0) return `Expires in ${hours}h`;
  if (minutes > 0) return `Expires in ${minutes}m`;
  return "Expires soon";
}

function NoteForm({ user, className }: { user: User; className?: string }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const expiration = use$(expiration$);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      setSending(true);

      // Send wrapped message to self
      await actions.run(SendWrappedMessage, user.pubkey, note.trim(), {
        expiration: expiration ? unixNow() + EXPIRATIONS[expiration] : undefined,
      });

      setNote("");
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className={clsx("flex flex-col gap-2", className)}>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={sending}
        placeholder="Write your note..."
        className="textarea textarea-bordered grow min-h-24 w-full"
        rows={3}
      />
      <div className="flex gap-2 justify-end items-center">
        <button type="submit" className="btn btn-primary" disabled={sending}>
          Create Note
        </button>
      </div>
    </form>
  );
}

function CommentForm({ note }: { note: Rumor }) {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const expiration = use$(expiration$);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSending(true);

      // Send reply to the note with expiration
      await actions.run(ReplyToWrappedMessage, note, comment.trim(), {
        expiration: expiration ? unixNow() + EXPIRATIONS[expiration] : undefined,
      });

      setComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2 w-full mt-4">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={sending}
        placeholder="Add a comment..."
        className="input input-bordered grow"
      />
      <button type="submit" className="btn btn-primary" disabled={sending}>
        Comment
      </button>
    </form>
  );
}

function CommentCard({ comment }: { comment: Rumor }) {
  const expiration = useMemo(
    () =>
      getRumorGiftWraps(comment)
        .map(getExpirationTimestamp)
        .find((v) => typeof v === "number"),
    [comment],
  );

  const expirationText = formatExpiration(expiration);

  return (
    <div className="border-l-2 border-base-300 pl-4 py-2">
      <div className="whitespace-pre-line">{comment.content}</div>
      <div className="flex items-center gap-2 mt-1">
        <time className="text-xs opacity-50">{new Date(comment.created_at * 1000).toLocaleString()}</time>
        {expirationText && (
          <span className={clsx("text-xs", expirationText === "Expired" ? "text-error" : "opacity-50")}>
            • {expirationText}
          </span>
        )}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  comments,
  selected,
  onSelect,
}: {
  note: Rumor;
  comments: Rumor[];
  selected: boolean;
  onSelect: () => void;
}) {
  const truncatedContent = note.content.length > 200 ? note.content.slice(0, 200) + "..." : note.content;
  const expiration = useMemo(
    () =>
      getRumorGiftWraps(note)
        .map(getExpirationTimestamp)
        .find((v) => typeof v === "number"),
    [note],
  );

  const expirationText = formatExpiration(expiration);

  return (
    <div className="border border-base-300 rounded-lg p-4">
      <div className="cursor-pointer" onClick={onSelect}>
        <div className="whitespace-pre-line">{selected ? note.content : truncatedContent}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <time className="text-xs opacity-50">{new Date(note.created_at * 1000).toLocaleString()}</time>
            {expirationText && (
              <span className={clsx("text-xs", expirationText === "Expired" ? "text-error" : "opacity-50")}>
                • {expirationText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && <span className="badge badge-sm">{comments.length} comments</span>}
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-4 space-y-2">
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
          <CommentForm note={note} />
        </div>
      )}
    </div>
  );
}

function RelayItem({ relay }: { relay: string }) {
  const inst = useMemo(() => pool.relay(relay), [relay]);
  const supported = use$(inst.supported$);
  const icon = use$(inst.icon$);
  const information = use$(inst.information$);
  const name = information?.name || new URL(relay).hostname;

  return (
    <div className="flex gap-2 items-center">
      <img src={icon} className="w-6 h-6 rounded-full" />
      <p className={clsx("font-mono", { "decoration-line-through": !supported?.includes(77) })}>{name}</p>
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

function NotesView({ user }: { user: User }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>();
  const signer = use$(signer$);
  const [since, setSince] = useState<number>(() => unixNow() - EXPIRATIONS["2 weeks"]); // 1 week ago
  const expiration = use$(expiration$);
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
            .sync(dmRelays, eventStore, { kinds: [kinds.GiftWrap], "#p": [user.pubkey], since }, SyncDirection.RECEIVE)
            .pipe(
              tap(() => setSynced((v) => v + 1)),
              // Ignore errors
              catchError(() => EMPTY),
            ),
    // Resync when user, since, or DM relays change
    [user.pubkey, since, dmRelays?.join(",")],
  );

  // Select all unlocked gift wraps
  const messages =
    use$(
      () =>
        eventStore.model(WrappedMessagesModel, user.pubkey).pipe(
          map((messages) =>
            messages.filter(
              // Filter down to only self-sent messages
              (msg) => msg.pubkey === user.pubkey && getConversationParticipants(msg).every((p) => p === user.pubkey),
            ),
          ),
        ),
      [user.pubkey],
    ) ?? [];

  // Separate root notes from comments
  const rootNotes = useMemo(
    () => messages.filter((note) => !getWrappedMessageParent(note)).sort((a, b) => b.created_at - a.created_at),
    [messages],
  );

  // Get comments for each note
  const getCommentsForNote = (noteId: string) => {
    return messages
      .filter((note) => getWrappedMessageParent(note) === noteId)
      .sort((a, b) => a.created_at - b.created_at);
  };

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

  return (
    <div className="flex flex-col bg-base-200 overflow-hidden h-screen">
      <div className="flex flex-col gap-3 p-4 bg-base-100 border-b border-base-300">
        <div className="flex gap-2 justify-between">
          {dmRelays ? <InlineRelayList relays={dmRelays} /> : <p className="text-error">No DM relays found</p>}

          <div className="flex gap-2 items-center">
            {locked && locked.length > 0 && (
              <button className="btn btn-primary ms-auto" onClick={unlock} disabled={unlocking}>
                {unlocking ? "Unlocking..." : `Unlock pending (${locked.length})`}
              </button>
            )}

            <div className="flex items-center gap-2 whitespace-pre">
              <label>Sync from:</label>
              <input
                type="date"
                className="input input-bordered"
                value={formatDateForInput(since)}
                onChange={handleDateChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <label>Expiration:</label>
              <select
                className="select select-bordered"
                value={expiration}
                onChange={(e) => expiration$.next(e.target.value === "none" ? "" : e.target.value)}
              >
                <option value="">None</option>
                {Object.keys(EXPIRATIONS).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-sm opacity-70">
            {rootNotes.length} notes • {synced} events synced • {messages.length} unlocked • {locked?.length ?? 0}{" "}
            locked • {failed.length} failed
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto space-y-4 w-full">
        {rootNotes.length === 0 ? (
          <div className="text-center py-12 text-base-content/50">
            <p>No notes yet. Create your first note above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                comments={getCommentsForNote(note.id)}
                selected={selectedNoteId === note.id}
                onSelect={() => setSelectedNoteId(selectedNoteId === note.id ? undefined : note.id)}
              />
            ))}
          </div>
        )}

        <NoteForm className="w-full" user={user} />
      </div>
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

  // Show notes view when both storage and login are ready
  return <NotesView user={user} />;
}

export default App;
