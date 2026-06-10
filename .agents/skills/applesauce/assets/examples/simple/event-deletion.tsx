/**
 * Delete notes and events from the Nostr network using deletion events
 * @tags nip-09, deletion, events, timeline
 * @related simple/profile-editor
 */
import { castUser, Note, User } from "applesauce-common/casts";
import { DeleteFactory, EventStore } from "applesauce-core";
import { getDisplayName, kinds } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

// Setup application state
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

function NoteItem({
  note,
  isSelected,
  onToggleSelect,
  onDelete,
  isDeleting,
}: {
  note: Note;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const profile = use$(note.author.profile$);
  const createdAt = new Date(note.event.created_at * 1000);

  return (
    <div className="card bg-base-100">
      <div className="card-body p-4">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            className="checkbox checkbox-primary mt-2"
            checked={isSelected}
            onChange={onToggleSelect}
            disabled={isDeleting}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img
                    src={profile?.picture ?? `https://robohash.org/${note.author.pubkey}.png`}
                    alt={getDisplayName(profile)}
                  />
                </div>
              </div>
              <div>
                <div className="font-semibold">{getDisplayName(profile)}</div>
                <div className="text-sm text-base-content/60">{createdAt.toLocaleString()}</div>
              </div>
            </div>
            <p className="whitespace-pre-wrap wrap-break-word">{note.event.content}</p>
            <div className="card-actions justify-end mt-3">
              <button className="btn btn-sm btn-error" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesList({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user's kind 1 notes
  useEffect(() => {
    const sub = pool
      .subscription(
        // User outboxes or fallback
        user.outboxes$.pipe(
          map((outboxes) => outboxes ?? ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]),
        ),
        // Filter for kind 1 notes by the user
        {
          kinds: [kinds.ShortTextNote],
          authors: [user.pubkey],
          limit: 50,
        },
        { eventStore },
      )
      .subscribe();

    return () => sub.unsubscribe();
  }, [user.pubkey]);

  const notes = use$(() => user.timeline$({ kinds: [kinds.ShortTextNote], limit: 50 }, Note), [user.pubkey]);

  const hasSelection = selectedIds.size > 0;

  const handleToggleSelect = (noteId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const handleDelete = async (eventsToDelete: (string | NostrEvent)[]) => {
    if (!signer || !outboxes || outboxes.length === 0) {
      setError("Missing signer or outboxes. Cannot delete events.");
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(false);

    try {
      const signed = await DeleteFactory.fromEvents(eventsToDelete).sign(signer);

      // Publish to user's outboxes
      await pool.publish(outboxes, signed);

      // Add the delete event to the store
      eventStore.add(signed);

      // Clear selection
      setSelectedIds(new Set());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to delete events:", err);
      setError(err instanceof Error ? err.message : "Failed to delete events");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!notes || selectedIds.size === 0) return;

    const eventsToDelete = notes.filter((note) => selectedIds.has(note.id)).map((note) => note.event);
    await handleDelete(eventsToDelete);
  };

  const handleDeleteSingle = async (note: Note) => {
    await handleDelete([note.event]);
  };

  if (!notes) {
    return (
      <div className="container mx-auto my-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
          <span className="ml-4">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Event Deletion Manager</h1>
      <p className="text-base-content/70 mb-6">View and delete your recent kind 1 notes using NIP-09 delete events.</p>

      {error && (
        <div className="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Events deleted successfully!</span>
        </div>
      )}

      {/* Bulk Actions */}
      {notes.length > 0 && hasSelection && (
        <div className="card bg-base-100 mb-6">
          <div className="card-body p-4">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-4">
                <span className="text-sm text-base-content/70">
                  {selectedIds.size} of {notes.length} selected
                </span>
                <button className="btn btn-error" onClick={handleDeleteSelected} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Deleting...
                    </>
                  ) : (
                    `Delete Selected (${selectedIds.size})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>No notes found. You haven't posted any kind 1 notes yet.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedIds.has(note.id)}
              onToggleSelect={() => handleToggleSelect(note.id)}
              onDelete={() => handleDeleteSingle(note)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventDeletionExample() {
  const user = use$(user$);

  if (!user) {
    return (
      <LoginView
        onLogin={(newSigner, newPubkey) => {
          signer$.next(newSigner);
          pubkey$.next(newPubkey);
        }}
      />
    );
  }

  return <NotesList user={user} />;
}
