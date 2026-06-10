/**
 * Blossom Server Manager for managing Blossom servers for decentralized content hosting
 * @tags nip-96, blossom, server, management
 * @related feed/relay-timeline
 */
import { ActionRunner } from "applesauce-actions";
import { AddBlossomServer, RemoveBlossomServer, SetDefaultBlossomServer } from "applesauce-actions/actions/blossom";
import { EventStore } from "applesauce-core";
import { useObservableEagerState, use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { useCallback, useEffect, useState } from "react";
import { BehaviorSubject, firstValueFrom, toArray } from "rxjs";

import { addRelayHintsToPointer } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";

// Global state
const pubkey$ = new BehaviorSubject<string | null>(null);

// Create event store
const eventStore = new EventStore();

// Setup relay connection pool
const pool = new RelayPool();

// Create NIP-07 signer
const signer = new ExtensionSigner();

// Create action hub for running actions
const actions = new ActionRunner(eventStore, signer);

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

// Server item component with favicon and reordering
function ServerItem({
  server,
  index,
  isDefault,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetDefault,
}: {
  server: URL;
  index: number;
  isDefault: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetDefault: () => void;
}) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  // Try to load favicon
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const httpsUrl = server.toString().replace("wss://", "https://").replace("ws://", "http://");
        const faviconUrl = new URL("/favicon.ico", httpsUrl).toString();

        // Test if favicon exists
        const img = new Image();
        img.onload = () => setFaviconUrl(faviconUrl);
        img.onerror = () => setFaviconError(true);
        img.src = faviconUrl;
      } catch (error) {
        setFaviconError(true);
      }
    };

    loadFavicon();
  }, [server]);

  const displayUrl = server.toString().replace("wss://", "").replace("ws://", "");

  return (
    <div className={`flex items-center gap-3 p-2 hover:bg-base-100 rounded ${isDefault ? "bg-primary/10" : ""}`}>
      {/* Favicon */}
      <div className="avatar">
        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
          {faviconUrl && !faviconError ? (
            <img src={faviconUrl} alt="Favicon" className="w-full h-full rounded-full" />
          ) : (
            <span className="text-xs">🌸</span>
          )}
        </div>
      </div>

      {/* Server info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm truncate">{displayUrl}</span>
          {isDefault && <span className="badge badge-primary badge-sm">Default</span>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1">
        <button className="btn btn-xs btn-ghost" onClick={onMoveUp} disabled={index === 0} title="Move up">
          ↑
        </button>
        <button className="btn btn-xs btn-ghost" onClick={onMoveDown} title="Move down">
          ↓
        </button>
        {!isDefault && (
          <button className="btn btn-xs btn-outline btn-primary" onClick={onSetDefault} title="Set as default">
            ⭐
          </button>
        )}
        <button className="btn btn-xs btn-outline btn-error" onClick={onRemove} title="Remove server">
          ✕
        </button>
      </div>
    </div>
  );
}

// Add server form component
function AddServerForm({ onAdd }: { onAdd: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isAdding) return;

      setIsAdding(true);
      try {
        let url = input.trim();
        // Add wss:// prefix if missing
        if (!url.startsWith("wss://") && !url.startsWith("ws://") && !url.startsWith("http")) {
          url = `wss://${url}`;
        }

        // Validate URL
        new URL(url);

        await onAdd(url);
        setInput("");
      } catch (error) {
        alert("Invalid URL format");
      } finally {
        setIsAdding(false);
      }
    },
    [input, onAdd, isAdding],
  );

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Add Blossom Server</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder="wss://blossom.example.com or blossom.example.com"
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

// Main component
export default function BlossomServerManager() {
  const pubkey = useObservableEagerState(pubkey$);
  const [error, setError] = useState<string | null>(null);

  // Get user's mailboxes (outbox relays)
  const mailboxes = use$(() => (pubkey ? eventStore.mailboxes(pubkey) : undefined), [pubkey]);

  // Get user's blossom servers
  const servers = use$(
    () =>
      pubkey
        ? eventStore.blossomServers(addRelayHintsToPointer({ pubkey, relays: [] }, mailboxes?.outboxes))
        : undefined,
    [pubkey, mailboxes],
  );

  // Handle adding a server
  const handleAddServer = useCallback(
    async (url: string) => {
      if (!pubkey || !mailboxes?.outboxes?.length) return;

      try {
        setError(null);
        const events = await firstValueFrom(actions.exec(AddBlossomServer, url).pipe(toArray()));

        // Publish the event to outbox relays
        for (const event of events) await pool.publish(mailboxes.outboxes, event);
      } catch (err) {
        console.error("Failed to add server:", err);
        setError("Failed to add server: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    },
    [pubkey, mailboxes?.outboxes],
  );

  // Handle removing a server
  const handleRemoveServer = useCallback(
    async (server: URL) => {
      if (!pubkey || !mailboxes?.outboxes?.length) return;

      try {
        setError(null);
        const events = await firstValueFrom(actions.exec(RemoveBlossomServer, server).pipe(toArray()));

        // Publish the event to outbox relays
        for (const event of events) await pool.publish(mailboxes.outboxes, event);
      } catch (err) {
        console.error("Failed to remove server:", err);
        setError("Failed to remove server: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    },
    [pubkey, mailboxes?.outboxes],
  );

  // Handle setting default server (move to top)
  const handleSetDefault = useCallback(
    async (server: URL) => {
      if (!pubkey || !mailboxes?.outboxes?.length) return;

      try {
        setError(null);
        const events = await firstValueFrom(actions.exec(SetDefaultBlossomServer, server).pipe(toArray()));

        // Publish the event to outbox relays
        for (const event of events) await pool.publish(mailboxes.outboxes, event);
      } catch (err) {
        console.error("Failed to set default server:", err);
        setError("Failed to set default server: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    },
    [pubkey, mailboxes?.outboxes],
  );

  // Handle reordering (simplified - just set as default for now)
  const handleMoveUp = useCallback(
    async (server: URL, currentIndex: number) => {
      if (currentIndex === 0) return;
      // For now, just set as default if moving to top
      if (currentIndex === 1) await handleSetDefault(server);
    },
    [handleSetDefault],
  );

  const handleMoveDown = useCallback(
    async (_server: URL, currentIndex: number) => {
      if (!servers || currentIndex === servers.length - 1) return;
      // For now, we don't implement complex reordering
      // In a full implementation, you'd need to rebuild the entire list
    },
    [servers],
  );

  // Handle login with extension
  const handleLogin = useCallback(async () => {
    const pk = await signer.getPublicKey();
    pubkey$.next(pk);
  }, []);

  const handleLogout = useCallback(() => {
    pubkey$.next(null);
    setError(null);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blossom Server Manager</h1>
          <p className="text-base-content/70">
            Manage your Blossom media servers. The first server in the list is your default server.
          </p>
        </div>
        {pubkey ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">
              {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
            </span>
            <button className="btn btn-sm btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleLogin}>
            Login with Extension
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Connection status */}
      {pubkey && mailboxes && (
        <div className="mb-6 bg-base-100 rounded">
          <h2 className="text-lg font-semibold mb-3">Outbox Relays</h2>
          <div className="text-sm">
            <div className="mt-2 flex flex-wrap gap-1">
              {mailboxes.outboxes?.map((relay) => (
                <span key={relay} className="text-xs bg-base-200 rounded px-2 py-1 font-mono">
                  {relay.replace("wss://", "").replace("ws://", "")}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!pubkey ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Welcome to Blossom Server Manager</h2>
          <p className="text-base-content/60 text-lg mb-6">
            Connect your Nostr extension to manage your Blossom media servers
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleLogin}>
            Login with Extension
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add server form */}
          <AddServerForm onAdd={handleAddServer} />

          {/* Server list */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Blossom Servers ({servers?.length || 0})</h2>

            {!servers || servers.length === 0 ? (
              <div className="text-center py-12 text-base-content/60 bg-base-50 rounded">
                No Blossom servers configured yet. Add one above to get started!
              </div>
            ) : (
              <div className="space-y-1">
                {servers.map((server, index) => (
                  <ServerItem
                    key={server.toString()}
                    server={server}
                    index={index}
                    isDefault={index === 0}
                    onRemove={() => handleRemoveServer(server)}
                    onMoveUp={() => handleMoveUp(server, index)}
                    onMoveDown={() => handleMoveDown(server, index)}
                    onSetDefault={() => handleSetDefault(server)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
