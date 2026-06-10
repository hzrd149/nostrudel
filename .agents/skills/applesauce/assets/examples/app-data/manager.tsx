/**
 * Store and retrieve application-specific data using NIP-78 app-specific events
 * @tags misc, app-data, nip-78, storage
 * @related misc/nip-19-links
 */
import { castUser, User } from "applesauce-common/casts";
import { AppDataFactory } from "applesauce-common/factories";
import {
  APP_DATA_KIND,
  getAppDataContent,
  getAppDataEncryption,
  isAppDataUnlocked,
} from "applesauce-common/helpers/app-data";
import { DeleteFactory, EventStore, mapEventsToStore, watchEventUpdates } from "applesauce-core";
import { EncryptionMethod, getReplaceableIdentifier, kinds, NostrEvent } from "applesauce-core/helpers";
import { getHiddenContent, unlockHiddenContent } from "applesauce-core/helpers/hidden-content";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useEffect, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

const eventStore = new EventStore();
const pool = new RelayPool();

const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Describes how the content of an app-data event should be displayed
type ContentDisplay =
  | { kind: "empty" }
  | { kind: "locked"; method: EncryptionMethod }
  | { kind: "json"; value: unknown }
  | { kind: "raw"; value: string; encrypted: boolean };

// Detect strings with control chars (likely binary payload rather than text)
function isBinary(s: string) {
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0E-\x1F]/.test(s);
}

function getContentDisplay(event: NostrEvent): ContentDisplay {
  if (event.content.length === 0) return { kind: "empty" };

  const encryption = getAppDataEncryption(event);
  if (encryption && !isAppDataUnlocked(event)) return { kind: "locked", method: encryption };

  const parsed = getAppDataContent(event);
  if (parsed !== undefined) return { kind: "json", value: parsed };

  // Not JSON — fall back to the raw string (decrypted if the event was encrypted)
  const raw = encryption ? (getHiddenContent(event) ?? "") : event.content;
  return { kind: "raw", value: raw, encrypted: !!encryption };
}

function EventView({
  event,
  signer,
  onEdit,
  onDelete,
}: {
  event: NostrEvent;
  signer: ISigner | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encryption = getAppDataEncryption(event);
  const unlocked = isAppDataUnlocked(event);

  const display = use$(
    () =>
      eventStore.event(event.id).pipe(
        watchEventUpdates(eventStore),
        map((e) => e && getContentDisplay(e)),
      ),
    [event.id],
  );

  const handleDecrypt = async () => {
    if (!signer || !encryption) return;
    try {
      setDecrypting(true);
      setError(null);
      // Use unlockHiddenContent directly so non-JSON payloads don't throw
      await unlockHiddenContent(event, signer, encryption);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <>
      <div className="navbar border-b border-base-300 gap-2">
        <div className="flex-1 min-w-0 px-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold truncate">{getReplaceableIdentifier(event)}</h2>
            {encryption && <span className="badge badge-warning">{encryption}</span>}
          </div>
          <div className="opacity-60 truncate">
            {new Date(event.created_at * 1000).toLocaleString()} · {event.content.length} chars · {event.tags.length}{" "}
            tags
          </div>
        </div>
        <div className="flex gap-2">
          {encryption && !unlocked && (
            <button className="btn btn-primary" onClick={handleDecrypt} disabled={decrypting || !signer}>
              {decrypting && <span className="loading loading-spinner" />}
              Decrypt
            </button>
          )}
          <button className="btn" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-error btn-outline" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Content</h3>
          {display?.kind === "empty" && <p className="opacity-60">This event has no content.</p>}
          {display?.kind === "locked" && (
            <p className="opacity-60">Encrypted with {display.method}. Decrypt to view.</p>
          )}
          {display?.kind === "json" && (
            <pre className="bg-base-200 rounded p-3 overflow-x-auto">{JSON.stringify(display.value, null, 2)}</pre>
          )}
          {display?.kind === "raw" && (
            <>
              <p className="opacity-60 mb-2">
                {display.encrypted ? "Decrypted " : ""}
                {isBinary(display.value) ? "binary data" : "non-JSON text"} · {display.value.length} chars
              </p>
              <pre className="bg-base-200 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                {display.value}
              </pre>
            </>
          )}
        </div>

        {event.tags.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="space-y-1">
              {event.tags.map((tag, i) => (
                <div key={i} className="flex gap-2 items-baseline">
                  <kbd className="kbd">{tag[0]}</kbd>
                  <span className="font-mono break-all">{tag.slice(1).join(" · ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="opacity-60 font-mono break-all">
          <div>id: {event.id}</div>
          <div>pubkey: {event.pubkey}</div>
        </div>
      </div>
    </>
  );
}

function EventEditor({
  event,
  signer,
  onSave,
  onCancel,
}: {
  event: NostrEvent;
  signer: ISigner | null;
  onSave: (event: NostrEvent) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(() => {
    try {
      return JSON.stringify(getAppDataContent(event), null, 2);
    } catch {
      return event.content;
    }
  });
  const [encryption, setEncryption] = useState(getAppDataEncryption(event));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!signer) return;
    try {
      setSaving(true);
      setError(null);
      const parsed = JSON.parse(content);
      const signed = await AppDataFactory.modify(event).as(signer).data(parsed, encryption).sign();
      onSave(signed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="navbar border-b border-base-300 gap-2">
        <div className="flex-1 min-w-0 px-2">
          <h2 className="text-xl font-bold truncate">Editing: {getReplaceableIdentifier(event)}</h2>
        </div>
        <div className="flex gap-2">
          <select
            className="select"
            value={encryption || ""}
            onChange={(e) => setEncryption(e.target.value ? (e.target.value as EncryptionMethod) : undefined)}
            disabled={saving}
          >
            <option value="">Plain text</option>
            <option value="nip44">NIP-44</option>
            <option value="nip04">NIP-04</option>
          </select>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !signer}>
            {saving && <span className="loading loading-spinner" />}
            Save
          </button>
          <button className="btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        <textarea
          className="textarea textarea-bordered font-mono flex-1 min-h-64"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder='{"key": "value"}'
        />
      </div>
    </>
  );
}

function AppDataManager({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Subscribe to the user's app data events on their outboxes
  useEffect(() => {
    if (!outboxes?.length) return;
    const sub = pool
      .subscription(outboxes, [
        { kinds: [APP_DATA_KIND], authors: [user.pubkey] },
        { kinds: [kinds.EventDeletion], "#k": [String(APP_DATA_KIND)], authors: [user.pubkey] },
      ])
      .pipe(mapEventsToStore(eventStore))
      .subscribe();
    return () => sub.unsubscribe();
  }, [outboxes?.join("|"), user.pubkey]);

  const events = use$(() => eventStore.timeline({ kinds: [APP_DATA_KIND], authors: [user.pubkey] }), [user.pubkey]);

  const selected = events?.find((e) => e.id === selectedId) ?? null;

  const handleSave = async (updated: NostrEvent) => {
    eventStore.add(updated);
    if (outboxes?.length) await pool.publish(outboxes, updated);
    setSelectedId(updated.id);
    setEditing(false);
  };

  const handleDelete = async (event: NostrEvent) => {
    if (!signer || !confirm("Delete this event?")) return;

    try {
      const signed = await DeleteFactory.fromEvents([event]).sign(signer);
      if (outboxes?.length) await pool.publish(outboxes, signed);
      eventStore.remove(event.id);
      if (selectedId === event.id) {
        setSelectedId(null);
        setEditing(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  return (
    <div className="flex flex-1 min-h-0 max-h-dvh">
      <aside className="w-80 shrink-0 border-r border-base-300 flex flex-col bg-base-200 overflow-hidden">
        <div className="px-4 py-3 font-semibold border-b border-base-300">Events ({events?.length ?? 0})</div>
        <div className="flex-1 overflow-y-auto">
          {!outboxes ? (
            <div className="p-4 opacity-60 text-center">Loading outboxes...</div>
          ) : !events || events.length === 0 ? (
            <div className="p-4 opacity-60 text-center">No app data events found.</div>
          ) : (
            <ul className="menu w-full">
              {events.map((event) => {
                const enc = getAppDataEncryption(event);
                return (
                  <li key={event.id}>
                    <a
                      className={selectedId === event.id ? "menu-active" : ""}
                      onClick={() => {
                        setSelectedId(event.id);
                        setEditing(false);
                      }}
                    >
                      <div className="flex flex-col gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold truncate flex-1">{getReplaceableIdentifier(event)}</span>
                          {enc && <span className="badge badge-warning">{enc}</span>}
                        </div>
                        <div className="opacity-60">
                          {new Date(event.created_at * 1000).toLocaleDateString()} · {event.content.length} chars
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center opacity-60">Select an event to view details</div>
        ) : editing ? (
          <EventEditor
            key={selected.id}
            event={selected}
            signer={signer}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <EventView
            event={selected}
            signer={signer}
            onEdit={() => setEditing(true)}
            onDelete={() => handleDelete(selected)}
          />
        )}
      </main>
    </div>
  );
}

export default function AppDataExample() {
  const user = use$(user$);

  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
  };

  if (!user) return <LoginView onLogin={handleLogin} />;
  return <AppDataManager user={user} />;
}
