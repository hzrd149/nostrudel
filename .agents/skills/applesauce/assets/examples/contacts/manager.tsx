/**
 * Manage your contact list (follows) with the ability to add and remove contacts
 * @tags nip-02, nip-65, casting, contacts, follows
 * @related casting/mutes, casting/thread
 */
import { ProxySigner } from "applesauce-accounts";
import { ActionRunner } from "applesauce-actions";
import { FollowUser, UnfollowUser } from "applesauce-actions/actions";
import { castUser, User } from "applesauce-common/casts";
import { defined, EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useCallback, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";
import PubkeyPicker from "../../components/pubkey-picker";

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
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

function ContactCard({ user, onUnfollow }: { user: User; onUnfollow: () => void }) {
  const profile = use$(() => user.profile$, [user.pubkey]);

  const displayName = getDisplayName(profile, user.pubkey.slice(0, 8) + "...");
  const picture = getProfilePicture(profile, `https://robohash.org/${user.pubkey}.png`);

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img src={picture} alt={displayName} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{displayName}</div>
            <div className="text-sm text-base-content/60 font-mono truncate">{user.pubkey.slice(0, 16)}...</div>
          </div>
          <button className="btn btn-sm btn-error btn-ghost" onClick={onUnfollow}>
            Unfollow
          </button>
        </div>
      </div>
    </div>
  );
}

function AddContactForm({ onAdd }: { onAdd: (pubkey: string) => Promise<void> }) {
  const [pubkey, setPubkey] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!pubkey.trim()) return;

    try {
      setAdding(true);
      await onAdd(pubkey.trim());
      setPubkey("");
    } catch (err) {
      console.error("Failed to add contact:", err);
      alert(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setAdding(false);
    }
  }, [pubkey, onAdd]);

  return (
    <div className="card bg-base-100 shadow-sm mb-4">
      <div className="card-body">
        <h3 className="card-title text-lg mb-2">Add Contact</h3>
        <div className="flex gap-2">
          <PubkeyPicker value={pubkey} onChange={setPubkey} className="flex-1" />
          <button className="btn btn-primary" onClick={handleAdd} disabled={!pubkey.trim() || adding}>
            {adding ? <span className="loading loading-spinner loading-sm" /> : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactManager({ user }: { user: User }) {
  const contacts = use$(() => user.contacts$, [user.pubkey]);
  const outboxes = use$(() => user.outboxes$, [user.pubkey]);

  const handleAdd = useCallback(
    async (pubkey: string) => {
      if (!outboxes?.length) {
        throw new Error("No outbox relays available. Please set up your mailboxes (NIP-65).");
      }

      try {
        await actions.exec(FollowUser, pubkey).forEach(async (signed) => {
          // Publish to outboxes
          await pool.publish(outboxes, signed);
        });
      } catch (err) {
        throw err;
      }
    },
    [outboxes],
  );

  const handleUnfollow = useCallback(
    async (contact: User) => {
      if (!outboxes?.length) {
        alert("No outbox relays available. Please set up your mailboxes (NIP-65).");
        return;
      }

      try {
        await actions.exec(UnfollowUser, contact.pubkey).forEach(async (signed) => {
          // Publish to outboxes
          await pool.publish(outboxes, signed);
        });
      } catch (err) {
        console.error("Failed to unfollow:", err);
        alert(err instanceof Error ? err.message : "Failed to unfollow user");
      }
    },
    [outboxes],
  );

  return (
    <div className="container mx-auto my-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Contact Manager</h1>

      <AddContactForm onAdd={handleAdd} />

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Contacts {contacts ? `(${contacts.length})` : ""}</h2>
      </div>

      {contacts && contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard key={contact.pubkey} user={contact} onUnfollow={() => handleUnfollow(contact)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-base-content/60">
          <p>No contacts yet. Add your first contact above!</p>
        </div>
      )}
    </div>
  );
}

export default function ContactManagerExample() {
  const signer = use$(signer$);
  const pubkey = use$(pubkey$);
  const user = use$(user$);

  if (!signer || !pubkey || !user) {
    return (
      <LoginView
        onLogin={(newSigner, newPubkey) => {
          signer$.next(newSigner);
          pubkey$.next(newPubkey);
        }}
      />
    );
  }

  return <ContactManager user={user} />;
}
