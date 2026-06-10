/**
 * Display a feed of comments with threading and reply functionality
 * @tags nip-10, nip-22, comment, feed, replies
 * @related content/articles, casting/thread
 */
import { Comment } from "applesauce-common/casts";
import { COMMENT_KIND, CommentPointer } from "applesauce-common/helpers";
import { CommentsModel } from "applesauce-common/models";
import { castTimelineStream } from "applesauce-common/observable";
import { CommentFactory } from "applesauce-common/factories";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { Filter, NostrEvent, persistEventsToCache, relaySet } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { useEffect, useState } from "react";
import { BehaviorSubject, EMPTY } from "rxjs";
import RelayPicker from "../../components/relay-picker";

// Setup event store
const eventStore = new EventStore();

// Create a relay pool for connections
const pool = new RelayPool();

// Setup a local event cache
const cache = await openDB();
function cacheRequest(filters: Filter[]) {
  return getEventsForFilters(cache, filters).then((events) => {
    console.log("loaded events from cache", events.length);
    return events;
  });
}

// Save all new events to the cache
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  lookupRelays: ["wss://purplepag.es/", "wss://relay.damus.io/"],
});

const appRelays = new BehaviorSubject<string[]>(["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/"]);

// BehaviorSubject to store the selected thread root pointer
const selectedThread$ = new BehaviorSubject<CommentPointer | null>(null);

const signer = new ExtensionSigner();

/** Component to render a single comment in the feed */
function CommentItem({ comment }: { comment: Comment }) {
  const profile = use$(comment.author.profile$);
  const rootEvent = use$(comment.root$);
  const parentEvent = use$(comment.parent$);
  const rootPointer = comment.rootPointer;
  const replyPointer = comment.replyPointer;

  const displayName = profile?.displayName || comment.author.npub;
  const picture = profile?.picture || `https://robohash.org/${comment.author.pubkey}.png`;

  // Get parent comment author profile if parent is a comment
  const parentProfile = use$(() => {
    if (!parentEvent || parentEvent.kind !== COMMENT_KIND) return undefined;
    return eventStore.profile({ pubkey: parentEvent.pubkey });
  }, [parentEvent?.pubkey, parentEvent?.kind]);

  // Format pointer info for display
  const formatPointer = (pointer: typeof rootPointer) => {
    if (!pointer) return "Unknown";
    if (pointer.type === "event") {
      return `Event ${pointer.id.slice(0, 8)}... (kind ${pointer.kind})`;
    } else if (pointer.type === "address") {
      return `Address ${pointer.identifier} (kind ${pointer.kind})`;
    } else if (pointer.type === "external") {
      return `External ${pointer.identifier}`;
    }
    return "Unknown";
  };

  // Format content summary (first 50 chars)
  const formatContentSummary = (content: string) => {
    if (!content) return "";
    const summary = content.trim().slice(0, 50);
    return summary.length < content.trim().length ? `${summary}...` : summary;
  };

  return (
    <div
      className="border-b border-base-300 pb-4 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => selectedThread$.next(comment.rootPointer)}
    >
      {/* Replying to line at the top */}
      {replyPointer && parentEvent && (
        <div className="mb-2 text-sm text-base-content/60 border-b border-base-300 pb-2">
          {parentEvent.kind === COMMENT_KIND ? (
            <>
              <span className="font-medium">{parentProfile?.displayName || parentEvent.pubkey.slice(0, 8)}...</span>
              {": "}
              <span>{formatContentSummary(parentEvent.content || "")}</span>
              {" - "}
              <time>{new Date(parentEvent.created_at * 1000).toLocaleDateString()}</time>
            </>
          ) : (
            <span>Replying to: {formatPointer(replyPointer)}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="avatar">
          <div className="w-10 rounded-full">
            <img src={picture} alt={displayName} />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{displayName}</h3>
          <p className="text-sm text-base-content/60">{comment.author.npub}</p>
        </div>
        <time className="text-sm text-base-content/60">{comment.createdAt.toLocaleString()}</time>
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        <p className="whitespace-pre-wrap">{comment.event.content}</p>
      </div>

      {/* Root Event Info - What they're commenting on */}
      <div className="mb-2 p-2 bg-base-200 rounded text-sm">
        <div className="font-medium text-base-content/80 mb-1">Commenting on:</div>
        <div className="text-base-content/60">
          {rootEvent ? (
            <div>
              <span>
                Kind {rootEvent.kind} event by {rootEvent.pubkey.slice(0, 8)}...
              </span>
              {rootEvent.content && <div className="mt-1 text-xs truncate">{rootEvent.content.slice(0, 100)}...</div>}
            </div>
          ) : (
            <span>{formatPointer(rootPointer)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Simple reply form component */
function ReplyForm({
  parentEvent,
  onSuccess,
  onCancel,
}: {
  parentEvent: NostrEvent;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const relays = use$(appRelays);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Check for signer
      if (typeof window === "undefined" || !(window as any).nostr) {
        setError("No Nostr extension found. Please install a Nostr browser extension like Alby or nos2x.");
        return;
      }

      // Create and sign comment
      const signed = await CommentFactory.create(parentEvent, content.trim()).sign(signer);

      // Publish to relays
      await pool.publish(relays, signed);

      // Clear form and notify success
      setContent("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to create comment:", err);
      setError(err instanceof Error ? err.message : "Failed to create comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full">
      <div className="form-control w-full">
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Write a reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      {error && (
        <div className="alert alert-error mt-2 w-full">
          <span>{error}</span>
        </div>
      )}
      <div className="flex justify-end mt-2 w-full">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Posting...
            </>
          ) : (
            "Reply"
          )}
        </button>
      </div>
    </form>
  );
}

/** Component to render a comment in the thread view (recursive) */
function ThreadComment({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const profile = use$(comment.author.profile$);
  const replies = use$(comment.replies$);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const displayName = profile?.displayName || comment.author.npub;
  const picture = profile?.picture || `https://robohash.org/${comment.author.pubkey}.png`;

  return (
    <>
      <div className={`${depth > 0 ? "ml-6 mt-4 border-l-2 border-base-300 pl-4" : ""}`}>
        <div className="border-b border-base-300 pb-3 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src={picture} alt={displayName} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{displayName}</h4>
              <p className="text-xs text-base-content/60">{comment.author.npub}</p>
            </div>
            <time className="text-xs text-base-content/60">{comment.createdAt.toLocaleString()}</time>
          </div>

          <div className="mb-2">
            <p className="whitespace-pre-wrap text-sm">{comment.event.content}</p>
            {!showReplyForm && (
              <button
                className="btn btn-link btn-primary p-2 float-right"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                Reply
              </button>
            )}
          </div>

          {showReplyForm && (
            <ReplyForm
              parentEvent={comment.event}
              onCancel={() => setShowReplyForm(false)}
              onSuccess={() => {
                setShowReplyForm(false);
              }}
            />
          )}
        </div>
      </div>

      {/* Recursively render replies */}
      {replies && replies.length > 0 && (
        <>
          {replies.map((reply) => (
            <ThreadComment key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </>
      )}
    </>
  );
}

/** Component for the thread view */
function ThreadView({ rootPointer, onBack }: { rootPointer: CommentPointer; onBack: () => void }) {
  // Create a unique key for the pointer for dependency tracking
  const pointerKey = JSON.stringify(rootPointer);

  // Load the root event from the pointer
  const rootEvent = use$(() => {
    if (rootPointer.type === "event" || rootPointer.type === "address") {
      return eventStore.event(rootPointer);
    }
    return undefined;
  }, [pointerKey]);

  // Load all comments in the thread by subscribing to comments that reference the root
  // The event store loader will handle fetching these automatically when we request them via the model
  // But we can also proactively subscribe to ensure we get all comments
  use$(() => {
    if (rootPointer.type !== "event" && rootPointer.type !== "address") return EMPTY;

    return pool
      .subscription(appRelays, {
        kinds: [COMMENT_KIND],
        ...(rootPointer.type === "event"
          ? // Root is a normal event
            { "#E": [rootPointer.id] }
          : // Root is a replaceable event
            { "#a": [`${rootPointer.kind}:${rootPointer.pubkey}:${rootPointer.identifier}`] }),
        limit: 500,
      })
      .pipe(mapEventsToStore(eventStore));
  }, [pointerKey]);

  // Get all top-level comments (comments that reply directly to the root event)
  const topLevelComments = use$(
    () => eventStore.model(CommentsModel, rootPointer).pipe(castTimelineStream(Comment, eventStore)),
    [rootPointer],
  );

  return (
    <div className="container mx-auto my-8 max-w-6xl px-4 w-full">
      <div className="py-4">
        <button className="btn btn-ghost gap-2 mb-4" onClick={onBack}>
          ← Back to Feed
        </button>

        <div>
          <h1 className="text-3xl font-bold mb-6">Comment Thread</h1>

          {/* Root Event Display */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Root Event</h2>
            {rootEvent ? (
              <div className="bg-base-200 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs">
                  <code>{JSON.stringify(rootEvent, null, 2)}</code>
                </pre>
              </div>
            ) : (
              <div>
                <div>
                  Loading root event... ({rootPointer.type === "event" ? rootPointer.id.slice(0, 16) : "address"})
                </div>
                <code>
                  <pre>{JSON.stringify(rootPointer, null, 2)}</pre>
                </code>
              </div>
            )}
          </div>

          {/* Reply to Root Event */}
          {rootEvent && (
            <div className="mt-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Reply to Root Event</h2>
              <ReplyForm parentEvent={rootEvent} />
            </div>
          )}

          {/* Thread of Comments */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            {topLevelComments === undefined ? (
              <div className="flex justify-center my-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : topLevelComments.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <p>No comments yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLevelComments.map((comment) => (
                  <ThreadComment key={comment.id} comment={comment} depth={0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentFeed() {
  const relays = use$(appRelays);
  const selectedThread = use$(selectedThread$);
  const [selectedRelay, setSelectedRelay] = useState(relays[0] || "");

  // Sync selectedRelay with relays array
  useEffect(() => {
    if (relays.length > 0 && !relays.includes(selectedRelay)) {
      setSelectedRelay(relays[0]);
    } else if (relays.length === 0) {
      setSelectedRelay("");
    }
  }, [relays, selectedRelay]);

  const handleRelayChange = (relay: string) => {
    setSelectedRelay(relay);
    if (relay && !relays.includes(relay)) {
      appRelays.next(relaySet(relays, relay));
    }
  };

  const handleRemoveRelay = (relayToRemove: string) => {
    const newRelays = relays.filter((r) => r !== relayToRemove);
    appRelays.next(newRelays);
    // Update selected relay if the removed one was selected
    if (selectedRelay === relayToRemove && newRelays.length > 0) {
      setSelectedRelay(newRelays[0]);
    } else if (newRelays.length === 0) {
      setSelectedRelay("");
    }
  };

  // Subscribe to kind 1111 comments
  use$(
    () =>
      pool.subscription(relays, { kinds: [COMMENT_KIND], limit: 200 }).pipe(
        // Add all events to the store
        mapEventsToStore(eventStore),
      ),
    [relays],
  );

  // Get all comments from the store
  const comments = use$(
    () => eventStore.timeline({ kinds: [COMMENT_KIND] }).pipe(castTimelineStream(Comment, eventStore)),
    [],
  );

  if (selectedThread) return <ThreadView rootPointer={selectedThread} onBack={() => selectedThread$.next(null)} />;

  return (
    <div className="max-w-6xl w-full mx-auto my-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Comment Feed</h1>
        <p className="text-base-content/60 mb-4">
          A feed of NIP-22 kind 1111 comments. Click on any comment to view the full thread.
        </p>
        <div className="space-y-2">
          <RelayPicker value={selectedRelay} onChange={handleRelayChange} />
          <div className="flex flex-wrap gap-2">
            {relays.map((relay) => (
              <div key={relay} className="badge badge-lg badge-primary gap-2">
                <span>{relay}</span>
                <button
                  className="btn btn-ghost btn-circle"
                  onClick={() => handleRemoveRelay(relay)}
                  aria-label={`Remove ${relay}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {comments === undefined ? (
          <div className="flex justify-center my-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/60">No comments found. Try a different relay.</p>
          </div>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  );
}
