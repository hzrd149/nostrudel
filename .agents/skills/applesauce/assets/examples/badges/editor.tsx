/**
 * Edit profile badge pins: reorder, add from awards, and remove
 * @tags nip-58, profile, badges, editing
 * @related badges/profile
 */
import { Badge, BadgeAward, castUser, ProfileBadges, User } from "applesauce-common/casts";
import { ProfileBadgesFactory } from "applesauce-common/factories";
import {
  LEGACY_PROFILE_BADGES_IDENTIFIER,
  LEGACY_PROFILE_BADGES_KIND,
  PROFILE_BADGES_KIND,
  ProfileBadgeSlot,
} from "applesauce-common/helpers";
import { EventStore } from "applesauce-core/event-store";
import { getReplaceableAddressFromPointer, kinds, relaySet } from "applesauce-core/helpers";
import { NostrEvent } from "applesauce-core/helpers/event";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { nip19 } from "nostr-tools";
import { useCallback, useMemo, useRef, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

const RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const LOOKUP_RELAYS = ["wss://purplepag.es", "wss://index.hzrd149.com"];

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: LOOKUP_RELAYS,
  extraRelays: RELAYS,
});

const signer$ = new BehaviorSubject<ISigner | undefined>(undefined);
const user$ = new BehaviorSubject<User | undefined>(undefined);

function formatPubkey(pk: string) {
  try {
    return nip19.npubEncode(pk).slice(0, 12) + "…";
  } catch {
    return pk.slice(0, 8) + "…";
  }
}

// ---- Drag-and-drop reorder helpers ----

type DragState = { dragging: number | null; over: number | null };

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// ---- Badge slot card for the pinned list ----

function PinnedBadgeCard({
  badge,
  award,
  index,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
}: {
  badge: Badge | undefined;
  award: BadgeAward | undefined;
  index: number;
  dragState: DragState;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
  onRemove: (i: number) => void;
}) {
  const name = badge?.name || badge?.identifier || "Loading…";
  const image = badge?.image?.url;
  const isDragging = dragState.dragging === index;
  const isOver = dragState.over === index && dragState.dragging !== index;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 border rounded-lg cursor-grab transition-all ${
        isDragging ? "opacity-40" : ""
      } ${isOver ? "border-primary bg-base-200" : "border-base-300"}`}
    >
      <span className="text-base-content/40 font-mono text-sm w-6 text-center select-none">{index + 1}</span>
      <div className="avatar">
        <div className="w-10 rounded-lg bg-base-200">
          {image ? (
            <img src={image} alt={name} />
          ) : (
            <span className="flex items-center justify-center h-full text-lg">🏅</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{name}</div>
        {badge?.description && <div className="text-xs text-base-content/60 truncate">{badge.description}</div>}
      </div>
      {award && (
        <div className="text-xs text-base-content/50 hidden sm:block">{award.createdAt.toLocaleDateString()}</div>
      )}
      <button className="btn btn-ghost btn-xs btn-square" onClick={() => onRemove(index)} title="Remove">
        ✕
      </button>
    </div>
  );
}

// ---- Resolved pinned badge row (subscribes to badge$/award) ----

function ResolvedPinnedSlot(props: {
  slot: ProfileBadgeSlot;
  index: number;
  dragState: DragState;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
  onRemove: (i: number) => void;
  profileBadges: ProfileBadges;
}) {
  const resolved = use$(() => props.profileBadges.slot$(props.index), [props.profileBadges, props.index]);
  return (
    <PinnedBadgeCard
      badge={resolved?.badge}
      award={resolved?.award}
      index={props.index}
      dragState={props.dragState}
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragEnd={props.onDragEnd}
      onRemove={props.onRemove}
    />
  );
}

// ---- Award picker modal ----

function AwardPickerRow({
  award,
  pinnedAddresses,
  onAdd,
}: {
  award: BadgeAward;
  pinnedAddresses: Set<string>;
  onAdd: (award: BadgeAward) => void;
}) {
  const badge = use$(() => award.badge$, [award.id]);
  const name = badge?.name || badge?.identifier || "Badge";
  const image = badge?.image?.url;
  const address = getReplaceableAddressFromPointer(award.pointer);
  const alreadyPinned = pinnedAddresses.has(address);

  return (
    <div className="flex items-center gap-3 p-3 border-b border-base-200 last:border-b-0">
      <div className="avatar">
        <div className="w-10 rounded-lg bg-base-200">
          {image ? (
            <img src={image} alt={name} />
          ) : (
            <span className="flex items-center justify-center h-full text-lg">🏅</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{name}</div>
        {badge?.description && <div className="text-xs text-base-content/60 truncate">{badge.description}</div>}
        <div className="text-xs text-base-content/40">
          Issued by {formatPubkey(award.issuer.pubkey)} · {award.createdAt.toLocaleDateString()}
        </div>
      </div>
      <button className="btn btn-sm btn-primary" disabled={alreadyPinned} onClick={() => onAdd(award)}>
        {alreadyPinned ? "Pinned" : "Add"}
      </button>
    </div>
  );
}

function AwardPickerModal({
  awards,
  pinnedAddresses,
  onAdd,
  onClose,
}: {
  awards: BadgeAward[];
  pinnedAddresses: Set<string>;
  onAdd: (award: BadgeAward) => void;
  onClose: () => void;
}) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          ✕
        </button>
        <h3 className="text-lg font-bold mb-4">Add Badge from Awards</h3>
        {awards.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">No badge awards found for your account.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto -mx-2 px-2">
            {awards.map((award) => (
              <AwardPickerRow key={award.id} award={award} pinnedAddresses={pinnedAddresses} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

// ---- Publish log types ----

type RelayResult = { relay: string; ok: boolean; message?: string };
type PublishLogEntry = { id: string; action: string; timestamp: Date; results: RelayResult[] };

function getFactory(event: NostrEvent | undefined) {
  return event ? ProfileBadgesFactory.modify(event) : ProfileBadgesFactory.create();
}

// ---- Main editor view ----

function EditorView({ user }: { user: User }) {
  const profileBadges = use$(() => user.profileBadges$, [user.pubkey]);
  const mailboxes = use$(() => user.mailboxes$, [user.pubkey]);

  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragState, setDragState] = useState<DragState>({ dragging: null, over: null });
  const [publishLog, setPublishLog] = useState<PublishLogEntry[]>([]);

  const badgesRef = useRef(profileBadges);
  badgesRef.current = profileBadges;
  const mailboxesRef = useRef(mailboxes);
  mailboxesRef.current = mailboxes;

  const slots = profileBadges?.slots ?? [];

  const publishRelays = useMemo(() => (mailboxes ? relaySet(RELAYS, mailboxes.outboxes) : RELAYS), [mailboxes]);

  const runAction = useCallback(async (action: string, factory: ProfileBadgesFactory) => {
    const signer = signer$.value;
    if (!signer) return;

    setBusy(true);
    try {
      const signed = await factory.sign(signer);
      const relays = mailboxesRef.current ? relaySet(RELAYS, mailboxesRef.current.outboxes) : RELAYS;
      const responses = await pool.publish(relays, signed);
      eventStore.add(signed);

      setPublishLog((prev) => [
        {
          id: signed.id,
          action,
          timestamp: new Date(),
          results: responses.map((r) => ({ relay: r.from, ok: r.ok, message: r.message })),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(`Failed to ${action}`, err);
    } finally {
      setBusy(false);
    }
  }, []);

  // Subscribe to relay data for this user's badge events and awards
  use$(() => {
    if (!user) return undefined;
    return pool.subscription(
      user.mailboxes$.pipe(map((all) => relaySet(RELAYS, all?.inboxes, all?.outboxes))),
      [
        { kinds: [kinds.Metadata, PROFILE_BADGES_KIND], authors: [user.pubkey] },
        { kinds: [LEGACY_PROFILE_BADGES_KIND], authors: [user.pubkey], "#d": [LEGACY_PROFILE_BADGES_IDENTIFIER] },
        { kinds: [kinds.BadgeAward], "#p": [user.pubkey] },
      ],
      { eventStore },
    );
  }, [user, mailboxes]);

  const awards = use$(() => user.badgeAwards$, [user.pubkey]);

  const pinnedAddresses = useMemo(() => {
    return new Set(slots.map((s) => getReplaceableAddressFromPointer(s.badge)));
  }, [slots]);

  // ---- drag handlers ----
  const onDragStart = useCallback((i: number) => setDragState({ dragging: i, over: null }), []);
  const onDragOver = useCallback((i: number) => setDragState((s) => ({ ...s, over: i })), []);
  const onDragEnd = useCallback(() => {
    setDragState((prev) => {
      if (prev.dragging !== null && prev.over !== null && prev.dragging !== prev.over) {
        const current = badgesRef.current?.slots ?? [];
        const reordered = reorder(current, prev.dragging, prev.over);
        runAction("reorder", getFactory(badgesRef.current?.event).slots(reordered));
      }
      return { dragging: null, over: null };
    });
  }, [runAction]);

  const handleRemove = useCallback(
    (index: number) => {
      const current = badgesRef.current?.slots ?? [];
      const slot = current[index];
      if (!slot) return;
      runAction("remove", getFactory(badgesRef.current?.event).removeByBadge(slot.badge));
    },
    [runAction],
  );

  const handleAdd = useCallback(
    (award: BadgeAward) => {
      setShowPicker(false);
      runAction(
        "add",
        getFactory(badgesRef.current?.event).addSlot({
          badge: award.pointer,
          award: { id: award.event.id, relays: [] },
        }),
      );
    },
    [runAction],
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Badge Editor</h1>
          <p className="text-sm text-base-content/60">Drag to reorder, add from awards, or remove pinned badges.</p>
        </div>
        <div className="flex items-center gap-2">
          {busy && <span className="loading loading-spinner loading-sm" />}
          <span className="badge badge-ghost font-mono text-xs">{formatPubkey(user.pubkey)}</span>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pinned Badges ({slots.length})</h2>
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setShowPicker(true)}>
            + Add Badge
          </button>
        </div>

        {slots.length === 0 && (
          <div className="text-center text-base-content/50 py-8 border border-dashed border-base-300 rounded-lg">
            No badges pinned yet. Add badges from your awards.
          </div>
        )}

        <div className="space-y-1">
          {slots.map((slot, i) =>
            profileBadges ? (
              <ResolvedPinnedSlot
                key={getReplaceableAddressFromPointer(slot.badge) + ":" + slot.award.id}
                slot={slot}
                index={i}
                dragState={dragState}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onRemove={handleRemove}
                profileBadges={profileBadges}
              />
            ) : (
              <div key={i} className="flex items-center gap-3 p-3 border border-base-300 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-base-200 rounded-lg" />
                <div className="flex-1 h-4 bg-base-200 rounded" />
              </div>
            ),
          )}
        </div>
      </section>

      {/* Outbox relays */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Publish Relays</h2>
        <div className="flex flex-wrap gap-1">
          {publishRelays.map((relay) => (
            <span key={relay} className="badge badge-outline badge-sm font-mono">
              {relay.replace("wss://", "")}
            </span>
          ))}
        </div>
      </section>

      {/* Publish log */}
      {publishLog.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Publish Log</h2>
            <button className="btn btn-ghost btn-xs" onClick={() => setPublishLog([])}>
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {publishLog.map((entry) => (
              <div key={entry.id} className="border border-base-300 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm capitalize">{entry.action}</span>
                  <span className="text-xs text-base-content/50">{entry.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="space-y-1">
                  {entry.results.map((r) => (
                    <div key={r.relay} className="flex items-center gap-2 text-xs font-mono">
                      <span className={`badge badge-xs ${r.ok ? "badge-success" : "badge-error"}`}>
                        {r.ok ? "OK" : "FAIL"}
                      </span>
                      <span className="text-base-content/70">{r.relay.replace("wss://", "")}</span>
                      {r.message && <span className="text-base-content/40 truncate">{r.message}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPicker && awards && (
        <AwardPickerModal
          awards={awards}
          pinnedAddresses={pinnedAddresses}
          onAdd={handleAdd}
          onClose={() => setShowPicker(false)}
        />
      )}

      {!awards && (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}
    </div>
  );
}

// ---- App shell with login ----

export default function BadgeEditorExample() {
  const signer = use$(signer$);
  const user = use$(user$);

  const handleLogin = useCallback(async (s: ISigner, pubkey: string) => {
    signer$.next(s);
    user$.next(castUser(pubkey, eventStore));
  }, []);

  if (!signer || !user) return <LoginView onLogin={handleLogin} />;
  return <EditorView user={user} />;
}
