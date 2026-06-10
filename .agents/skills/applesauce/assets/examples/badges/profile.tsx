/**
 * Render profile badges via casts and inspect who issued each award
 * @tags casting, nip-58, profile, badges
 * @related casting/thread, simple/profile-editor
 */
import { Badge, BadgeAward, User, castUser } from "applesauce-common/casts";
import {
  LEGACY_PROFILE_BADGES_IDENTIFIER,
  LEGACY_PROFILE_BADGES_KIND,
  PROFILE_BADGES_KIND,
} from "applesauce-common/helpers";
import { castTimelineStream } from "applesauce-common/observable";
import { EventStore } from "applesauce-core/event-store";
import {
  getAddressPointerForEvent,
  getReplaceableAddressFromPointer,
  kinds,
  normalizeToPubkey,
  relaySet,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { nip19 } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { BehaviorSubject, map } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

const pubkey$ = new BehaviorSubject<string>(
  normalizeToPubkey("npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr")!,
);
const selectedBadge$ = new BehaviorSubject<Badge | null>(null);

/** List of hard-coded relays to always use */
const RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
/** List of relays to use for looking up profiles */
const LOOKUP_RELAYS = ["wss://purplepag.es", "wss://index.hzrd149.com"];

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: LOOKUP_RELAYS,
  extraRelays: RELAYS,
});

function formatPubkey(pk: string) {
  try {
    return nip19.npubEncode(pk).slice(0, 12) + "…";
  } catch {
    return pk.slice(0, 8) + "…";
  }
}

function RecipientAvatar({ user }: { user: User }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const name = profile?.displayName || profile?.name || formatPubkey(user.pubkey);

  const handleClick = useCallback(() => {
    pubkey$.next(user.pubkey);
    selectedBadge$.next(null);
  }, [user.pubkey]);

  return (
    <div className="avatar tooltip cursor-pointer" data-tip={name} onClick={handleClick}>
      <div className="w-10 rounded-full bg-base-200 border border-base-300 hover:border-primary/40 transition-colors">
        {profile?.picture ? (
          <img src={profile.picture} alt={name} />
        ) : (
          <span className="flex items-center justify-center h-full text-sm">{name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

function ModalAwardRow({ award, index }: { award: BadgeAward; index: number }) {
  const isEven = index % 2 === 0;
  const isFirst = index === 0;

  return (
    <li>
      {!isFirst && <hr />}
      <div className="timeline-middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className={isEven ? "timeline-start mb-10 md:text-end" : "timeline-end md:mb-10"}>
        <time className="font-mono italic text-xs">{award.createdAt.toLocaleString()}</time>
        <div className="text-sm">
          Awarded to {award.recipients.length} recipient{award.recipients.length === 1 ? "" : "s"}
        </div>
      </div>
    </li>
  );
}

function BadgeDetailsModal() {
  const badge = use$(() => selectedBadge$, []);
  const pointer = useMemo(() => (badge ? getAddressPointerForEvent(badge.event) : undefined), [badge]);

  // Subscribe to all badge awards
  use$(() => {
    if (!badge || !pointer) return undefined;

    return pool.subscription(
      badge.author.outboxes$.pipe(map((outboxes) => outboxes ?? [])),
      [{ kinds: [kinds.BadgeAward], "#a": [getReplaceableAddressFromPointer(pointer)] }],
      { eventStore },
    );
  }, [badge, pointer]);

  const awards = use$(() => badge?.awards$, [badge]);
  const allRecipients = useMemo(() => {
    if (!awards || awards.length === 0) return [];

    const seen = new Set<string>();
    const users: User[] = [];
    for (const award of awards) {
      for (const user of award.recipients) {
        if (!seen.has(user.pubkey)) {
          seen.add(user.pubkey);
          users.push(user);
        }
      }
    }
    return users;
  }, [awards]);

  if (!badge) return null;

  const name = badge.name || badge.identifier || "Badge";
  const image = badge.image?.url;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={() => selectedBadge$.next(null)}
        >
          ✕
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="avatar">
            <div className="w-20 rounded-xl bg-base-200 border border-base-300">
              {image ? (
                <img src={image} alt={name} />
              ) : (
                <span className="flex items-center justify-center h-full text-4xl">🏅</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold">{name}</h3>
            <div className="text-sm text-base-content/60 font-mono">{badge.identifier}</div>
            {badge.description && <p className="text-base-content/80 mt-2">{badge.description}</p>}
          </div>
        </div>

        {allRecipients.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">Recipients ({allRecipients.length})</h4>
            <div className="flex flex-wrap gap-2">
              {allRecipients.map((user) => (
                <RecipientAvatar key={user.pubkey} user={user} />
              ))}
            </div>
          </div>
        )}

        {awards && awards.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">Award History ({awards.length})</h4>
            <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
              {awards.map((award, i) => (
                <ModalAwardRow key={award.id} award={award} index={i} />
              ))}
            </ul>
          </div>
        )}

        {awards && awards.length === 0 && (
          <div className="text-center text-base-content/50 py-4">No award events found for this badge.</div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => selectedBadge$.next(null)}>close</button>
      </form>
    </dialog>
  );
}

function BadgeSlotCard({ badge, award, user }: { badge: Badge; award?: BadgeAward; user: User }) {
  const issuerProfile = use$(() => award?.issuer.profile$, [award]);

  const title = badge.name || badge.identifier || "Badge";
  const description = badge.description;
  const image = badge.image?.url;
  const isRecipient = award?.recipients.some((p) => p.pubkey === user.pubkey) ?? false;

  return (
    <div
      className="card border border-base-300 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => selectedBadge$.next(badge)}
    >
      <div className="card-body p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-14 rounded-xl bg-base-200">
              {image ? (
                <img src={image} alt={title} />
              ) : (
                <span className="flex items-center justify-center h-full text-2xl">🏅</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="badge badge-ghost badge-sm">{isRecipient ? "Pinned" : "Award"}</span>
            </div>
            <h3 className="card-title text-base truncate">{title}</h3>
          </div>
        </div>
        {description && <p className="text-sm text-base-content/80">{description}</p>}
        {award ? (
          <div className="text-sm text-base-content/70 space-y-1">
            <div>
              Issuer:{" "}
              <span className="font-medium">
                {issuerProfile?.displayName || formatPubkey(award?.issuer.pubkey ?? "")}
              </span>
            </div>
            <div className="text-xs">
              {award.recipients.length} recipient tag{award.recipients.length === 1 ? "" : "s"}
            </div>
          </div>
        ) : (
          <p className="text-sm text-base-content/50">Waiting for award details…</p>
        )}
      </div>
    </div>
  );
}

function AwardRow({ award, index, total }: { award: BadgeAward; index: number; total: number }) {
  const badge = use$(() => award.badge$, [award.id]);
  const issuerProfile = use$(() => award.issuer.profile$, [award.id]);

  const isEven = index % 2 === 0;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const name = badge?.name || badge?.identifier || `${badge?.event.kind}:${badge?.identifier}`;
  const image = badge?.image?.url;

  const content = (
    <>
      <time className="font-mono italic text-xs">{award.createdAt.toLocaleString()}</time>
      <div className="text-lg font-black">{name}</div>
      <div className="text-sm text-base-content/70">
        Issuer:{" "}
        <span className="font-medium text-base-content">
          {issuerProfile?.displayName || formatPubkey(award.issuer.pubkey)}
        </span>
      </div>
      <div className="text-sm text-base-content/70">
        {award.recipients.length} recipient{award.recipients.length === 1 ? "" : "s"}
      </div>
    </>
  );

  const handleClick = useCallback(() => {
    if (badge) selectedBadge$.next(badge);
  }, [badge]);

  return (
    <li className="cursor-pointer" onClick={handleClick}>
      {!isFirst && <hr />}
      <div className="timeline-middle">
        <div className="avatar">
          <div className="w-12 h-12 rounded-xl border border-base-300 bg-base-200 hover:border-primary/40 transition-colors">
            {image ? (
              <img src={image} alt={name} />
            ) : (
              <span className="flex items-center justify-center h-full text-2xl">🏅</span>
            )}
          </div>
        </div>
      </div>
      {isEven ? (
        <div className="timeline-start mb-10 md:text-end">{content}</div>
      ) : (
        <div className="timeline-end md:mb-10">{content}</div>
      )}
      {!isLast && <hr />}
    </li>
  );
}

export default function ProfileBadgesExample() {
  const pubkey = use$(pubkey$);

  const user = useMemo(() => (pubkey ? castUser(pubkey, eventStore) : undefined), [pubkey]);
  const profile = use$(() => (user ? user.profile$ : undefined), [user?.pubkey]);
  const profileBadges = use$(() => user?.profileBadges$, [user]);
  const badges = use$(() => user?.profileBadges$.badges$, [user]);
  const mailboxes = use$(() => user?.mailboxes$, [user]);

  // Subscribe to a timeline of badges awards
  const awards = use$(() => {
    if (!user) return undefined;

    return eventStore
      .timeline({ kinds: [kinds.BadgeAward], "#p": [user.pubkey] })
      .pipe(castTimelineStream(BadgeAward, eventStore));
  }, [user]);

  // Subscribe to all users badge events and awards
  use$(() => {
    if (!user) return undefined;

    return pool.subscription(
      user?.mailboxes$.pipe(map((all) => relaySet(RELAYS, all?.inboxes, all?.outboxes))),
      [
        { kinds: [kinds.Metadata, PROFILE_BADGES_KIND], authors: [user.pubkey] },
        { kinds: [LEGACY_PROFILE_BADGES_KIND], authors: [user.pubkey], "#d": [LEGACY_PROFILE_BADGES_IDENTIFIER] },
        { kinds: [kinds.BadgeAward], "#p": [user.pubkey] },
      ],
      { eventStore },
    );
  }, [user, mailboxes]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <PubkeyPicker value={pubkey ?? ""} onChange={(p) => pubkey$.next(p)} placeholder="npub1…" />

      {profile ? (
        <div className="card border border-base-300">
          <div className="card-body p-4 gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="card-title">
                {profile.displayName || profile.name || formatPubkey(profile.event.pubkey)}
              </h2>
              <span className="badge badge-ghost badge-sm font-mono">{formatPubkey(profile.event.pubkey)}</span>
            </div>
            {profile.metadata.about && <p className="text-sm text-base-content/70">{profile.metadata.about}</p>}
          </div>
        </div>
      ) : (
        <div className="alert">
          <span>Provide a pubkey to load profile metadata and badges.</span>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Pinned Badges</h2>
          {profileBadges && <span className="badge badge-neutral">{profileBadges.count}</span>}
        </div>
        {profile && !profileBadges && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}
        {profileBadges && profileBadges.slots.length === 0 && (
          <div className="alert">
            <span>This profile has not selected any badges yet.</span>
          </div>
        )}
        {user && badges && badges.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges
              .filter((slot) => !!slot.badge)
              .map(({ badge, award }) => (
                <BadgeSlotCard key={badge?.uid + "-" + award?.id} badge={badge!} award={award} user={user} />
              ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Badge award timeline</h2>
          {awards && <span className="badge badge-neutral">{awards.length}</span>}
        </div>
        {pubkey && !awards && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}
        {awards && awards.length === 0 && (
          <div className="alert">
            <span>No badge award events referencing this pubkey were found during this session.</span>
          </div>
        )}
        {awards && awards.length > 0 && (
          <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
            {awards.map((award, i) => (
              <AwardRow key={award.id} award={award} index={i} total={awards.length} />
            ))}
          </ul>
        )}
      </section>

      <BadgeDetailsModal />
    </div>
  );
}
