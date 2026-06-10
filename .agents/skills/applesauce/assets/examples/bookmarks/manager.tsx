/**
 * Bookmarks Manager to create, manage, and organize bookmarks for notes and events
 * @tags nip-51, bookmarks, manager
 * @related feed/relay-timeline
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { BookmarkEvent, UnbookmarkEvent } from "applesauce-actions/actions";
import { Article, castUser, Note, User } from "applesauce-common/casts";
import { castEventStream } from "applesauce-common/observable";
import { defined, EventStore } from "applesauce-core";
import {
  AddressPointer,
  decodePointer,
  EventPointer,
  getReplaceableAddressFromPointer,
  isAddressPointer,
  isEventPointer,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

// Setup application state
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();
const actions = new ActionRunner(eventStore, new ProxySigner(signer$.pipe(defined())));

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  // Few hard coded relays to load articles and notes without relay hints
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

function BookmarkEventForm({ onAdd }: { onAdd: (event: NostrEvent, hidden: boolean) => Promise<void> }) {
  const [input, setInput] = useState("");
  const [hidden, setHidden] = useState(false);

  const pointer = useMemo(() => {
    if (!input.trim()) return null;

    try {
      const result = decodePointer(input.trim().replace(/^nostr:/, ""));
      if (result.type === "nevent") {
        return result.data;
      } else if (result.type === "naddr") {
        return result.data;
      }
    } catch (error) {}
    return null;
  }, [input]);

  const event = use$(() => (pointer ? eventStore.event(pointer) : undefined), [pointer]);

  const handleAdd = async () => {
    if (!event) return;
    await onAdd(event, hidden);

    // Clear input after add
    setInput("");
    setHidden(false);
  };

  return (
    <>
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Paste nevent or naddr here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {pointer ? (
        isEventPointer(pointer) ? (
          <BookmarkNote pointer={pointer} />
        ) : isAddressPointer(pointer) ? (
          <BookmarkArticle pointer={pointer} />
        ) : (
          <div className="flex items-center gap-3">
            <span className="loading loading-spinner" />
            <span>Loading preview...</span>
          </div>
        )
      ) : null}
      <div className="flex gap-2 justify-end mt-2">
        <label className="label">
          <span className="label-text">Hidden</span>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        </label>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!event}>
          Add
        </button>
      </div>
    </>
  );
}

function BookmarkNote({ pointer, onRemove }: { pointer: EventPointer; onRemove?: () => void }) {
  const note = use$(
    () => eventStore.event(pointer).pipe(castEventStream(Note, eventStore)),
    [pointer.id, pointer.relays?.join("|")],
  );
  const profile = use$(() => note?.author.profile$, [note]);

  if (!note)
    return (
      <div role="alert" className="alert alert-vertical sm:alert-horizontal">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-info h-6 w-6 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <h3 className="font-bold">Loading note {pointer.id}...</h3>
        </div>
        {onRemove && (
          <button className="btn btn-sm btn-error" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    );

  const displayName = profile?.displayName ?? note.author.npub.slice(0, 8) + "...";

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="card-title flex gap-2 items-center">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={profile?.picture ?? `https://robohash.org/${note.author.pubkey}.png`} alt={displayName} />
            </div>
          </div>
          <div>{displayName}</div>
          <div className="ms-auto text-sm opacity-60">{note.createdAt.toLocaleString()}</div>
        </div>
        <p className="line-clamp-5">{note.event.content}</p>

        {onRemove && (
          <div className="card-actions justify-end">
            <button className="btn btn-sm btn-error" onClick={onRemove}>
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookmarkArticle({ pointer, onRemove }: { pointer: AddressPointer; onRemove?: () => void }) {
  const article = use$(
    () => eventStore.replaceable(pointer).pipe(castEventStream(Article, eventStore)),
    [getReplaceableAddressFromPointer(pointer)],
  );
  const profile = use$(() => article?.author.profile$, [article]);

  if (!article)
    return (
      <div role="alert" className="alert alert-vertical sm:alert-horizontal">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-info h-6 w-6 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <h3 className="font-bold">Loading article {getReplaceableAddressFromPointer(pointer)}...</h3>
        </div>
        {onRemove && (
          <button className="btn btn-sm btn-error" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    );

  const displayName = profile?.displayName ?? article.author.npub.slice(0, 8) + "...";

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="card-title flex gap-2 items-center">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={profile?.picture ?? `https://robohash.org/${article.author.pubkey}.png`} alt={displayName} />
            </div>
          </div>
          <div>{displayName}</div>
          <div className="ms-auto text-sm opacity-60">{article.publishedDate.toLocaleDateString()}</div>
        </div>
        <div className="flex gap-2 w-full">
          {article.image && <img src={article.image} alt={article.title} className="h-48 object-cover aspect-video" />}
          <div>
            <h4 className="font-bold text-base mt-2">{article.title || "Untitled Article"}</h4>
            <p className="line-clamp-5">{article.summary}</p>
          </div>
        </div>

        {onRemove && (
          <div className="card-actions justify-end">
            <button className="btn btn-sm btn-error" onClick={onRemove}>
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookmarkManager({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);

  const bookmarks = use$(user.bookmarks$);

  // Get hidden bookmarks if unlocked
  const hasHidden = bookmarks?.hasHidden ?? false;
  const hidden = use$(bookmarks?.hidden$);

  // Get bookmarks
  const notes = use$(user.bookmarks$.notes);
  const articles = use$(user.bookmarks$.articles);
  const hiddenNotes = useMemo(() => hidden?.filter((pointer) => isEventPointer(pointer)), [hidden]);
  const hiddenArticles = useMemo(() => hidden?.filter((pointer) => isAddressPointer(pointer)), [hidden]);

  const [unlocking, setUnlocking] = useState(false);

  const handleAdd = async (event: NostrEvent, hidden: boolean) => {
    if (!signer || !outboxes?.length) return;

    try {
      await actions.exec(BookmarkEvent, event, undefined, hidden).forEach(async (signed) => {
        eventStore.add(signed);
        await pool.publish(outboxes, signed);
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add bookmark");
    }
  };

  const handleRemove = async (event: EventPointer | AddressPointer, hidden: boolean) => {
    if (!signer || !outboxes?.length) return;

    try {
      await actions.exec(UnbookmarkEvent, event, undefined, hidden).forEach(async (signed) => {
        eventStore.add(signed);
        await pool.publish(outboxes, signed);
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove bookmark");
    }
  };

  const handleUnlock = async () => {
    if (!bookmarks || !signer || unlocking) return;

    try {
      setUnlocking(true);
      await bookmarks.unlock(signer);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlock hidden bookmarks");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Bookmark Manager</h1>

      {/* Add Bookmark Form */}
      <BookmarkEventForm onAdd={handleAdd} />

      {/* Unlock Hidden Bookmarks */}
      {hasHidden && !hidden && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Hidden Bookmarks Available</h3>
                <p className="text-sm opacity-70">Unlock to view hidden bookmarks</p>
              </div>
              <button className="btn btn-primary" onClick={handleUnlock} disabled={unlocking || !signer}>
                {unlocking ? <span className="loading loading-spinner" /> : "Unlock Hidden Bookmarks"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!bookmarks ? (
        outboxes && outboxes.length > 0 ? (
          <div className="alert">
            <span>Loading bookmarks from {outboxes.join(", ")}</span>
          </div>
        ) : (
          <div className="alert">
            <span>Loading bookmarks...</span>
          </div>
        )
      ) : null}

      {/* Hidden Bookmarks List */}
      <div className="space-y-2">
        {hidden ? (
          hidden.length === 0 ? (
            <div className="alert alert-info">
              <span>No bookmarks yet. Add a bookmark using the form above.</span>
            </div>
          ) : (
            <h3 className="text-xl font-bold mb-3">Hidden Bookmarks ({hidden.length})</h3>
          )
        ) : null}

        {hiddenNotes && hiddenNotes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3">Notes ({hiddenNotes.length})</h2>
            <div className="space-y-2">
              {hiddenNotes.map((pointer) => (
                <BookmarkNote key={pointer.id} pointer={pointer} onRemove={() => handleRemove(pointer, true)} />
              ))}
            </div>
          </div>
        )}

        {hiddenArticles && hiddenArticles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3">Articles ({hiddenArticles.length})</h2>
            <div className="space-y-2">
              {hiddenArticles.map((pointer) => (
                <BookmarkArticle
                  key={getReplaceableAddressFromPointer(pointer)}
                  pointer={pointer}
                  onRemove={() => handleRemove(pointer, true)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="space-y-2 mt-4">
        {bookmarks ? (
          bookmarks.bookmarks.length === 0 ? (
            <div className="alert alert-info">
              <span>No bookmarks yet. Add a bookmark using the form above.</span>
            </div>
          ) : (
            <h3 className="text-xl font-bold mb-3">Bookmarks ({bookmarks.bookmarks.length})</h3>
          )
        ) : null}

        {notes && notes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3">Notes ({notes.length})</h2>
            <div className="space-y-2">
              {notes.map((pointer) => (
                <BookmarkNote key={pointer.id} pointer={pointer} onRemove={() => handleRemove(pointer, false)} />
              ))}
            </div>
          </div>
        )}

        {articles && articles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-3">Articles ({articles.length})</h2>
            <div className="space-y-2">
              {articles.map((pointer) => (
                <BookmarkArticle
                  key={getReplaceableAddressFromPointer(pointer)}
                  pointer={pointer}
                  onRemove={() => handleRemove(pointer, false)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookmarksExample() {
  const user = use$(user$);

  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
  };

  // Show login view if not logged in
  if (!user) return <LoginView onLogin={handleLogin} />;

  // Show main bookmark manager view
  return <BookmarkManager user={user} />;
}
