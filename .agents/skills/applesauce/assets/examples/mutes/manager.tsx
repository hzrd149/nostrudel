/**
 * Manage your mute list to hide content from specific users
 * @tags nip-51, casting, mutes, moderation
 * @related casting/contacts
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import {
  MuteHashtag,
  MuteThread,
  MuteUser,
  MuteWord,
  UnmuteHashtag,
  UnmuteThread,
  UnmuteUser,
  UnmuteWord,
} from "applesauce-actions/actions";
import { Article, castUser, Note, User } from "applesauce-common/casts";
import { castEventStream } from "applesauce-common/observable";
import { defined, EventStore, simpleTimeout } from "applesauce-core";
import {
  AddressPointer,
  decodePointer,
  EventPointer,
  getReplaceableAddressFromPointer,
  isEventPointer,
  npubEncode,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useMemo, useState } from "react";
import { BehaviorSubject, firstValueFrom, map } from "rxjs";
import LoginView from "../../components/login-view";
import PubkeyPicker from "../../components/pubkey-picker";

// Setup application state
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();
const actions = new ActionRunner(eventStore, new ProxySigner(signer$.pipe(defined())), async (event) => {
  // Get the users outboxes
  const mailboxes = await firstValueFrom(eventStore.mailboxes(event.pubkey).pipe(defined(), simpleTimeout(5_000)));

  if (!mailboxes?.outboxes?.length) throw new Error("No outboxes found");

  // Publish the event to the outboxes
  await pool.publish(mailboxes.outboxes, event);
});

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  // Few hard coded relays to load articles and notes without relay hints
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

function MuteHashtagForm({ onAdd }: { onAdd: (hashtag: string, hidden: boolean) => Promise<void> }) {
  const [input, setInput] = useState("");
  const [hidden, setHidden] = useState(false);

  const handleAdd = async () => {
    const hashtag = input.trim().toLowerCase().replace(/^#/, "");
    if (!hashtag) return;
    await onAdd(hashtag, hidden);
    setInput("");
    setHidden(false);
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="label">
          <span className="label-text">Hashtag</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Enter hashtag (without #)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label cursor-pointer">
          <span className="label-text">Hidden</span>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="checkbox" />
        </label>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!input.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

function MuteWordForm({ onAdd }: { onAdd: (word: string, hidden: boolean) => Promise<void> }) {
  const [input, setInput] = useState("");
  const [hidden, setHidden] = useState(false);

  const handleAdd = async () => {
    const word = input.trim().toLowerCase();
    if (!word) return;
    await onAdd(word, hidden);
    setInput("");
    setHidden(false);
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="label">
          <span className="label-text">Word</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Enter word to mute..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label cursor-pointer">
          <span className="label-text">Hidden</span>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="checkbox" />
        </label>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!input.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

function MutePubkeyForm({ onAdd }: { onAdd: (pubkey: string, hidden: boolean) => Promise<void> }) {
  const [pubkey, setPubkey] = useState("");
  const [hidden, setHidden] = useState(false);

  const handleAdd = async () => {
    if (!pubkey) return;
    await onAdd(pubkey, hidden);
    setPubkey("");
    setHidden(false);
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="label">
          <span className="label-text">User</span>
        </label>
        <PubkeyPicker value={pubkey} onChange={setPubkey} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label cursor-pointer">
          <span className="label-text">Hidden</span>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="checkbox" />
        </label>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!pubkey}>
          Add
        </button>
      </div>
    </div>
  );
}

function MuteThreadForm({ onAdd }: { onAdd: (thread: EventPointer, hidden: boolean) => Promise<void> }) {
  const [input, setInput] = useState("");
  const [hidden, setHidden] = useState(false);

  const pointer = useMemo(() => {
    if (!input.trim()) return null;

    try {
      const result = decodePointer(input.trim().replace(/^nostr:/, ""));
      if (result.type === "nevent") {
        return result.data;
      }
      // Mute lists only support event threads, not address threads
    } catch (error) {}
    return null;
  }, [input]);

  const event = use$(() => (pointer ? eventStore.event(pointer) : undefined), [pointer]);

  const handleAdd = async () => {
    if (!pointer || !event || !isEventPointer(pointer)) return;
    await onAdd(pointer, hidden);
    setInput("");
    setHidden(false);
  };

  const isValid = pointer && isEventPointer(pointer);
  const showError = input.trim() && !pointer;

  return (
    <>
      <input
        type="text"
        className={`input input-bordered w-full ${showError ? "input-error" : ""}`}
        placeholder="Paste nevent here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {showError && (
        <label className="label">
          <span className="label-text-alt text-error">Only nevent is supported for muting threads</span>
        </label>
      )}

      {pointer && isEventPointer(pointer) ? (
        <MutedThreadItem pointer={pointer} />
      ) : pointer ? (
        <div className="alert alert-error">
          <span>Only event threads (nevent) are supported for muting. Address threads (naddr) are not supported.</span>
        </div>
      ) : null}
      <div className="flex gap-2 justify-end mt-2">
        <label className="label cursor-pointer">
          <span className="label-text">Hidden</span>
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="checkbox" />
        </label>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!isValid || !event}>
          Add
        </button>
      </div>
    </>
  );
}

function MuteList<T>({
  items,
  onRemove,
  renderItem,
  emptyMessage,
}: {
  items: T[];
  onRemove: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return emptyMessage ? <div className="alert alert-info alert-soft">{emptyMessage}</div> : null;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-base-200 rounded">
          <div className="flex-1">{renderItem(item)}</div>
          <button className="btn btn-sm btn-error btn-ghost" onClick={() => onRemove(item)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function MutedPubkeyItem({ pubkey, onRemove }: { pubkey: string; onRemove?: () => void }) {
  const user = useMemo(() => castUser(pubkey, eventStore), [pubkey]);
  const profile = use$(user.profile$);

  const displayName = profile?.displayName ?? npubEncode(pubkey).slice(0, 8) + "...";
  const picture = profile?.picture ?? `https://robohash.org/${pubkey}.png`;

  return (
    <div className="flex items-center gap-3">
      <div className="avatar">
        <div className="w-10 rounded-full">
          <img src={picture} alt={displayName} />
        </div>
      </div>
      <div className="flex-1">
        <div className="font-medium">{displayName}</div>
        <div className="text-sm opacity-60 font-mono">{pubkey.slice(0, 16)}...</div>
      </div>
      {onRemove && (
        <button className="btn btn-sm btn-error btn-ghost" onClick={onRemove}>
          Remove
        </button>
      )}
    </div>
  );
}

function MutedThreadItem({ pointer, onRemove }: { pointer: EventPointer | AddressPointer; onRemove?: () => void }) {
  if (isEventPointer(pointer)) {
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
            <button className="btn btn-sm btn-error btn-ghost" onClick={onRemove}>
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
              <button className="btn btn-sm btn-error btn-ghost" onClick={onRemove}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
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
            <button className="btn btn-sm btn-error btn-ghost" onClick={onRemove}>
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
            {article.image && (
              <img src={article.image} alt={article.title} className="h-48 object-cover aspect-video" />
            )}
            <div>
              <h4 className="font-bold text-base mt-2">{article.title || "Untitled Article"}</h4>
              <p className="line-clamp-5">{article.summary}</p>
            </div>
          </div>

          {onRemove && (
            <div className="card-actions justify-end">
              <button className="btn btn-sm btn-error btn-ghost" onClick={onRemove}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function MuteManager({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);

  const mutes = use$(user.mutes$);

  // Get hidden mutes if unlocked
  const hasHidden = mutes?.hasHidden ?? false;
  const hidden = use$(mutes?.hidden$);

  // Get public mutes
  const publicHashtags = useMemo(() => Array.from(mutes?.hashtags ?? []), [mutes?.hashtags]);
  const publicWords = useMemo(() => Array.from(mutes?.words ?? []), [mutes?.words]);
  const publicPubkeys = useMemo(() => Array.from(mutes?.pubkeys ?? []), [mutes?.pubkeys]);
  const publicThreads = useMemo(() => Array.from(mutes?.threads ?? []), [mutes?.threads]);

  // Get hidden mutes
  const hiddenHashtags = useMemo(() => Array.from(hidden?.hashtags ?? []), [hidden?.hashtags]);
  const hiddenWords = useMemo(() => Array.from(hidden?.words ?? []), [hidden?.words]);
  const hiddenPubkeys = useMemo(() => Array.from(hidden?.pubkeys ?? []), [hidden?.pubkeys]);
  const hiddenThreads = useMemo(() => Array.from(hidden?.threads ?? []), [hidden?.threads]);

  const [unlocking, setUnlocking] = useState(false);

  const handleMuteHashtag = async (hashtag: string, hidden: boolean) => {
    await actions.run(MuteHashtag, hashtag, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to mute hashtag");
    });
  };

  const handleUnmuteHashtag = async (hashtag: string, hidden: boolean) => {
    await actions.run(UnmuteHashtag, hashtag, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to unmute hashtag");
    });
  };

  const handleMuteWord = async (word: string, hidden: boolean) => {
    await actions.run(MuteWord, word, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to mute word");
    });
  };

  const handleUnmuteWord = async (word: string, hidden: boolean) => {
    await actions.run(UnmuteWord, word, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to unmute word");
    });
  };

  const handleMutePubkey = async (pubkey: string, hidden: boolean) => {
    await actions.run(MuteUser, pubkey, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to mute user");
    });
  };

  const handleUnmutePubkey = async (pubkey: string, hidden: boolean) => {
    await actions.run(UnmuteUser, pubkey, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to unmute user");
    });
  };

  const handleMuteThread = async (thread: EventPointer, hidden: boolean) => {
    await actions.run(MuteThread, thread, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to mute thread");
    });
  };

  const handleUnmuteThread = async (thread: EventPointer | string, hidden: boolean) => {
    await actions.run(UnmuteThread, thread, hidden).catch((err) => {
      alert(err instanceof Error ? err.message : "Failed to unmute thread");
    });
  };

  const handleUnlock = async () => {
    if (!mutes || !signer || unlocking) return;

    try {
      setUnlocking(true);
      await mutes.unlock(signer);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlock hidden mutes");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mute Manager</h1>

      {/* Unlock Hidden Mutes */}
      {hasHidden && !hidden && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Hidden Mutes Available</h3>
                <p className="text-sm opacity-70">Unlock to view hidden mutes</p>
              </div>
              <button className="btn btn-primary" onClick={handleUnlock} disabled={unlocking || !signer}>
                {unlocking ? <span className="loading loading-spinner" /> : "Unlock Hidden Mutes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!mutes ? (
        outboxes && outboxes.length > 0 ? (
          <div className="alert">
            <span>Loading mutes from {outboxes.join(", ")}</span>
          </div>
        ) : (
          <div className="alert">
            <span>Loading mutes...</span>
          </div>
        )
      ) : null}

      {/* Mutes Section */}
      <div className="space-y-6">
        {/* Hashtags */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-3">
              Hashtags ({publicHashtags.length + (hidden?.hashtags.size ?? 0)})
            </h3>
            <MuteHashtagForm onAdd={(hashtag, hidden) => handleMuteHashtag(hashtag, hidden)} />
            <div className="mt-4">
              <div className="tabs tabs-lift">
                <input
                  type="radio"
                  name="hashtags_tabs"
                  className="tab"
                  aria-label={`Public (${publicHashtags.length})`}
                  defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={publicHashtags}
                    onRemove={(hashtag) => handleUnmuteHashtag(hashtag, false)}
                    renderItem={(hashtag) => <span className="font-mono">#{hashtag}</span>}
                    emptyMessage="No public hashtags muted"
                  />
                </div>

                <input
                  type="radio"
                  name="hashtags_tabs"
                  className="tab"
                  aria-label={`Hidden (${hiddenHashtags.length})`}
                  disabled={!hidden}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={hiddenHashtags}
                    onRemove={(hashtag) => handleUnmuteHashtag(hashtag, true)}
                    renderItem={(hashtag) => <span className="font-mono">#{hashtag}</span>}
                    emptyMessage="No hidden hashtags muted"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Words */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-3">Words ({publicWords.length + (hidden?.words.size ?? 0)})</h3>
            <MuteWordForm onAdd={(word, hidden) => handleMuteWord(word, hidden)} />
            <div className="mt-4">
              <div className="tabs tabs-lift">
                <input
                  type="radio"
                  name="words_tabs"
                  className="tab"
                  aria-label={`Public (${publicWords.length})`}
                  defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={publicWords}
                    onRemove={(word) => handleUnmuteWord(word, false)}
                    renderItem={(word) => <span className="font-mono">{word}</span>}
                    emptyMessage="No public words muted"
                  />
                </div>

                <input
                  type="radio"
                  name="words_tabs"
                  className="tab"
                  aria-label={`Hidden (${hiddenWords.length})`}
                  disabled={!hidden}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={hiddenWords}
                    onRemove={(word) => handleUnmuteWord(word, true)}
                    renderItem={(word) => <span className="font-mono">{word}</span>}
                    emptyMessage="No hidden words muted"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pubkeys */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-3">Users ({publicPubkeys.length + (hidden?.pubkeys.size ?? 0)})</h3>
            <MutePubkeyForm onAdd={(pubkey, hidden) => handleMutePubkey(pubkey, hidden)} />
            <div className="mt-4">
              <div className="tabs tabs-lift">
                <input
                  type="radio"
                  name="users_tabs"
                  className="tab"
                  aria-label={`Public (${publicPubkeys.length})`}
                  defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={publicPubkeys}
                    onRemove={(pubkey) => handleUnmutePubkey(pubkey, false)}
                    renderItem={(pubkey) => <MutedPubkeyItem pubkey={pubkey} />}
                    emptyMessage="No public users muted"
                  />
                </div>

                <input
                  type="radio"
                  name="users_tabs"
                  className="tab"
                  aria-label={`Hidden (${hiddenPubkeys.length})`}
                  disabled={!hidden}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <MuteList
                    items={hiddenPubkeys}
                    onRemove={(pubkey) => handleUnmutePubkey(pubkey, true)}
                    renderItem={(pubkey) => <MutedPubkeyItem pubkey={pubkey} />}
                    emptyMessage="No hidden users muted"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Threads */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-3">Threads ({publicThreads.length + (hidden?.threads.size ?? 0)})</h3>
            <MuteThreadForm onAdd={(thread, hidden) => handleMuteThread(thread, hidden)} />
            <div className="mt-4">
              <div className="tabs tabs-lift">
                <input
                  type="radio"
                  name="threads_tabs"
                  className="tab"
                  aria-label={`Public (${publicThreads.length})`}
                  defaultChecked
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <div className="space-y-2">
                    {publicThreads.length === 0 ? (
                      <div className="alert alert-info alert-soft">No public threads muted</div>
                    ) : (
                      publicThreads.map((threadId, index) => (
                        <MutedThreadItem
                          key={index}
                          pointer={{ id: threadId }}
                          onRemove={() => handleUnmuteThread(threadId, false)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <input
                  type="radio"
                  name="threads_tabs"
                  className="tab"
                  aria-label={`Hidden (${hiddenThreads.length})`}
                  disabled={!hidden}
                />
                <div className="tab-content bg-base-100 border-base-300 p-6 h-128 overflow-y-auto">
                  <div className="space-y-2">
                    {hiddenThreads.length === 0 ? (
                      <div className="alert alert-info alert-soft">No hidden threads muted</div>
                    ) : (
                      hiddenThreads.map((threadId, index) => (
                        <MutedThreadItem
                          key={index}
                          pointer={{ id: threadId }}
                          onRemove={() => handleUnmuteThread(threadId, true)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MutesExample() {
  const user = use$(user$);

  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
  };

  // Show login view if not logged in
  if (!user) return <LoginView onLogin={handleLogin} />;

  // Show main mute manager view
  return <MuteManager user={user} />;
}
