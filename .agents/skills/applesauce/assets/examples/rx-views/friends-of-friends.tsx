/**
 * Browse a user's contact network — click any contact to navigate their connections
 * @tags nip-02, contacts, social-graph, rx-views
 */
import { castUser, User } from "applesauce-common/casts";
import { combineLatestByValue, EventStore } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useMemo, useState } from "react";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  switchMap,
  takeUntil,
  timer,
} from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// ─── Rx View ───────────────────────────────────────────────────────────────────

/** Creates a view of the friends of a user's friends */
function FriendsOfFriendsView(user$: Observable<User>) {
  return user$.pipe(
    // Switch to the active user's contact list
    switchMap((user) => user.contacts$),
    // For each contact, subscribe to their contact list in parallel
    combineLatestByValue((contact) =>
      combineLatest({
        name: contact.profile$.displayName.pipe(
          // Get name or fallback to npub
          map((name) => name ?? contact.npub.slice(0, 12) + "…"),
        ),
        contacts: contact.contacts$.pipe(
          takeUntil(timer(10_000)), // 10s timeout for contact list request
          catchError((err) => of(err as Error)), // Catch error and pass back to UI
        ),
      }),
    ),
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  name,
  theirContacts,
  onClick,
}: {
  contact: User;
  name: string;
  theirContacts: User[] | Error | undefined;
  onClick: () => void;
}) {
  const profile = use$(() => contact.profile$, [contact.pubkey]);
  const picture = profile?.picture ?? `https://robohash.org/${contact.pubkey}.png`;

  const countBadge =
    theirContacts instanceof Error ? (
      <span className="badge badge-error badge-sm">err</span>
    ) : theirContacts === undefined ? (
      <span className="loading loading-spinner loading-xs opacity-30" />
    ) : (
      <span className="badge badge-ghost badge-sm">{theirContacts.length}</span>
    );

  return (
    <button
      className="flex items-center gap-3 p-3 border border-base-300 hover:bg-base-200 rounded-lg text-left w-full transition-colors"
      onClick={onClick}
    >
      <div className="avatar shrink-0">
        <div className="w-10 h-10 rounded-full border border-base-300">
          <img src={picture} alt={name} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">{name}</div>
        <div className="text-xs text-base-content/40 font-mono">{contact.pubkey.slice(0, 12)}…</div>
      </div>
      <div className="shrink-0">{countBadge}</div>
    </button>
  );
}

function ActiveUserHeader({ user }: { user: User }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const name = profile?.displayName ?? user.pubkey.slice(0, 8) + "…";
  const picture = profile?.picture ?? `https://robohash.org/${user.pubkey}.png`;

  return (
    <div className="flex items-center gap-3 p-3 border border-base-300 rounded-lg">
      <div className="avatar">
        <div className="w-14 h-14 rounded-full border border-base-300">
          <img src={picture} alt={name} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-base">{name}</div>
        <div className="text-xs text-base-content/50 font-mono truncate">{user.pubkey}</div>
      </div>
    </div>
  );
}

function BreadcrumbItem({ user, isLast, onClick }: { user: User; isLast: boolean; onClick: () => void }) {
  const profile = use$(() => user.profile$, [user.pubkey]);
  const name = profile?.displayName ?? user.pubkey.slice(0, 8) + "…";

  if (isLast) return <span className="text-sm font-medium">{name}</span>;

  return (
    <>
      <button className="text-sm text-base-content/50 hover:text-base-content transition-colors" onClick={onClick}>
        {name}
      </button>
      <span className="text-base-content/30 text-sm select-none">›</span>
    </>
  );
}

// ─── Main Example ──────────────────────────────────────────────────────────────

export default function FriendsOfFriends() {
  const [history, setHistory] = useState<User[]>([]);

  // Single stable subject — pushing here drives the entire view
  const user$ = useMemo(() => new BehaviorSubject<User | null>(null), []);

  // The whole UI runs off this one observable.
  // Clicking a contact calls user$.next(), which updates the view in-place.
  const contactsMap = use$(() => FriendsOfFriendsView(user$.pipe(filter((u): u is User => u !== null))), []);

  // Subscribe to the subject itself just to know which user is active for the header
  const currentUser = use$(user$);

  const handlePubkeyChange = (pubkey: string) => {
    if (!pubkey) return;
    const user = castUser(pubkey, eventStore);
    user$.next(user);
    setHistory([user]);
  };

  const navigateTo = (contact: User) => {
    user$.next(contact);
    setHistory((prev) => [...prev, contact]);
  };

  const navigateToHistoryItem = (index: number) => {
    user$.next(history[index]);
    setHistory((prev) => prev.slice(0, index + 1));
  };

  const contacts = contactsMap ? [...contactsMap.entries()] : null;

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold">Friends of Friends</h2>
        <p className="text-sm text-base-content/60">
          Browse a user's contact network. Click any contact to navigate to their connections.
        </p>
      </div>

      <PubkeyPicker value="" onChange={handlePubkeyChange} />

      {history.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {history.map((user, i) => (
            <BreadcrumbItem
              key={`${user.pubkey}-${i}`}
              user={user}
              isLast={i === history.length - 1}
              onClick={() => navigateToHistoryItem(i)}
            />
          ))}
        </div>
      )}

      {!currentUser && <p className="text-sm text-base-content/40">Enter a pubkey above to explore their network.</p>}

      {currentUser && (
        <>
          <ActiveUserHeader user={currentUser} />

          <div>
            <p className="text-sm font-semibold mb-2">
              Contacts
              {contacts !== null && <span className="font-normal text-base-content/40 ml-1">({contacts.length})</span>}
            </p>

            {contacts === null && (
              <div className="flex items-center gap-2 text-sm text-base-content/50">
                <span className="loading loading-spinner loading-xs" />
                Loading contacts…
              </div>
            )}

            {contacts !== null && contacts.length === 0 && (
              <p className="text-sm text-base-content/40">No contacts found.</p>
            )}

            {contacts !== null && contacts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {contacts.map(([contact, { name, contacts: theirContacts }]) => (
                  <ContactCard
                    key={contact.pubkey}
                    contact={contact}
                    name={name}
                    theirContacts={theirContacts}
                    onClick={() => navigateTo(contact)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
