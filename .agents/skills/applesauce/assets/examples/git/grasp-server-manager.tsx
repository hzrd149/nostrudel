/**
 * Grasp server manager for NIP-34 user grasp lists (kind 10317)
 * @tags nip-34, git, grasp, server, management
 * @related git/favorite-repos-feed, blossom/server-manager, bookmarks/manager
 */
import { castUser, type User } from "applesauce-common/casts";
import { GitGraspListFactory } from "applesauce-common/factories";
import { EventStore } from "applesauce-core";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useCallback, useMemo, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
  extraRelays: ["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/", "wss://relay.nostr.band/"],
});

function GraspServerItem({ url, onRemove }: { url: string; onRemove: () => void }) {
  const relay = useMemo(() => pool.relay(url), [url]);
  const iconUrl = use$(relay.icon$);
  const name = use$(relay.information$.pipe(map((info) => info?.name)));

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-base-100 rounded">
      <div className="avatar">
        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center overflow-hidden">
          {iconUrl ? (
            <img src={iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs" title="Grasp relay">
              ⚙
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <span className="font-mono text-sm truncate">{name || url}</span>
        <br />
        <small className="text-xs font-mono">{url}</small>
      </div>

      <div className="flex gap-1">
        <button className="btn btn-sm btn-error" onClick={onRemove} title="Remove server" type="button">
          ✕
        </button>
      </div>
    </div>
  );
}

function AddGraspServerForm({ onAdd }: { onAdd: (url: string) => void | Promise<void> }) {
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isAdding) return;

      setIsAdding(true);
      try {
        let url = input.trim();
        if (!url.startsWith("wss://") && !url.startsWith("ws://") && !url.startsWith("http")) {
          url = `wss://${url}`;
        }
        new URL(url);
        await onAdd(url);
        setInput("");
      } catch {
        alert("Invalid URL format");
      } finally {
        setIsAdding(false);
      }
    },
    [input, onAdd, isAdding],
  );

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Add Grasp Server</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder="wss://grasp.example.com or grasp.example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAdding}
        />
        <button
          type="submit"
          className={`btn btn-primary ${isAdding ? "loading" : ""}`}
          disabled={!input.trim() || isAdding}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}

function GraspServerManagerView({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);
  const graspList = use$(user.graspServers$);
  const servers = graspList?.servers ?? [];
  const [error, setError] = useState<string | null>(null);

  const publishSigned = useCallback(
    async (factory: GitGraspListFactory) => {
      if (!signer || !outboxes?.length) return;
      setError(null);
      try {
        const signed = await factory.sign(signer);
        eventStore.add(signed);
        await pool.publish(outboxes, signed);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to publish grasp list");
      }
    },
    [signer, outboxes],
  );

  const handleAdd = useCallback(
    async (url: string) => {
      if (!signer || !outboxes?.length) return;
      setError(null);
      try {
        if (graspList) await publishSigned(GitGraspListFactory.modify(graspList.event).addServer(url));
        else await publishSigned(GitGraspListFactory.create().addServer(url));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to add grasp server");
      }
    },
    [graspList, signer, outboxes, publishSigned],
  );

  const handleRemove = useCallback(
    async (url: string) => {
      if (!graspList || !signer || !outboxes?.length) return;
      setError(null);
      try {
        await publishSigned(GitGraspListFactory.modify(graspList.event).removeServer(url));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to remove grasp server");
      }
    },
    [graspList, signer, outboxes, publishSigned],
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Grasp Server Manager</h1>
          <p className="text-base-content/70">
            Manage NIP-34 grasp service relays (kind 10317). Lists are built with{" "}
            <code className="text-xs">GitGraspListFactory</code> and shown via the{" "}
            <code className="text-xs">GitGraspList</code> cast on <code className="text-xs">gitGraspList$</code>.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-base-content/70 font-mono">
            {user.pubkey.slice(0, 8)}…{user.pubkey.slice(-8)}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              localStorage.removeItem("accounts");
              localStorage.removeItem("active");
              signer$.next(null);
              pubkey$.next(null);
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {outboxes && outboxes.length > 0 && (
        <div className="mb-6 bg-base-100 rounded">
          <h2 className="text-lg font-semibold mb-3">Outbox relays</h2>
          <div className="text-sm flex flex-wrap gap-1">
            {outboxes.map((relay) => (
              <span key={relay} className="text-xs bg-base-200 rounded px-2 py-1 font-mono">
                {relay.replace("wss://", "").replace("ws://", "")}
              </span>
            ))}
          </div>
        </div>
      )}

      <AddGraspServerForm onAdd={handleAdd} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Your Grasp Servers ({servers.length})</h2>

        {outboxes && outboxes.length === 0 ? (
          <div className="alert alert-warning mb-4">
            <span>No outbox relays yet. Publish a NIP-65 relay list so your grasp list can be published.</span>
          </div>
        ) : null}

        {servers.length === 0 ? (
          <div className="text-center py-12 text-base-content/60 bg-base-50 rounded">
            No grasp servers configured. Add a relay URL above
          </div>
        ) : (
          <div className="space-y-1">
            {servers.map((url) => (
              <GraspServerItem key={url} url={url} onRemove={() => void handleRemove(url)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GraspServerManager() {
  const user = use$(user$);

  const handleLogin = useCallback(async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
  }, []);

  if (!user) return <LoginView onLogin={handleLogin} />;

  return <GraspServerManagerView user={user} />;
}
