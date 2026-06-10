/**
 * Display a timeline of gift-wrapped events with decryption support
 * @tags nip-44, nip-59, gift-wrap, timeline, encryption
 * @related gift-wrap/dashboard, gift-wrap/generator
 */
import { persistEncryptedContent } from "applesauce-common/helpers/encrypted-content-cache";
import { isGiftWrapUnlocked, unlockGiftWrap } from "applesauce-common/helpers/gift-wrap";
import { GiftWrapRumorModel, GiftWrapsModel } from "applesauce-common/models/gift-wrap";
import { defined, EventStore } from "applesauce-core";
import { kinds, NostrEvent } from "applesauce-core/helpers/event";
import { createTimelineLoader } from "applesauce-loaders/loaders";
import { useObservableEagerMemo, use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { type ISigner, ExtensionSigner } from "applesauce-signers";
import { useEffect, useMemo, useState } from "react";
import { BehaviorSubject } from "rxjs";

import LoginView from "../../components/login-view";
import RelayPicker from "../../components/relay-picker";
import UnlockView from "../../components/unlock-view";
import SecureStorage from "../../extra/encrypted-storage";

const storage$ = new BehaviorSubject<SecureStorage | null>(null);
const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const eventStore = new EventStore();
const pool = new RelayPool();

persistEncryptedContent(eventStore, storage$.pipe(defined()));

function GiftWrapEvent({ event, signer }: { event: NostrEvent; signer: ISigner }) {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlocked = isGiftWrapUnlocked(event);

  // Subscribe to when the rumor is unlocked
  const rumor = use$(() => eventStore.model(GiftWrapRumorModel, event.id), [event.id]);

  const handleUnlock = async () => {
    try {
      setUnlocking(true);
      setError(null);
      await unlockGiftWrap(event, signer);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unlock gift wrap";
      setError(errorMessage);
      console.error("Failed to unlock gift wrap:", err);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="border-b p-2">
      {unlocked === false ? (
        <div className="flex gap-2 justify-between">
          <h3 className="font-semibold">Locked Gift Wrap</h3>
          {error && <div className="text-error text-sm">{error}</div>}
          <button className="btn btn-primary" onClick={handleUnlock} disabled={unlocking}>
            {unlocking ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      ) : rumor ? (
        <pre className="bg-base-300 p-4 rounded-lg overflow-x-auto">
          <code>{JSON.stringify(rumor, null, 2)}</code>
        </pre>
      ) : null}
    </div>
  );
}

type FilterType = "all" | "locked" | "unlocked";
function HomeView({ pubkey, signer }: { pubkey: string; signer: ISigner }) {
  const [relay, setRelay] = useState<string>("wss://relay.damus.io/");
  const [filter, setFilter] = useState<FilterType>("all");

  // Subscribe to model based on filter type
  const events = useObservableEagerMemo(() => {
    switch (filter) {
      case "locked":
        return eventStore.model(GiftWrapsModel, pubkey, false);
      case "unlocked":
        return eventStore.model(GiftWrapsModel, pubkey, true);
      default:
        return eventStore.model(GiftWrapsModel, pubkey);
    }
  }, [pubkey, filter]);

  // Setup loader
  const loader$ = useMemo(
    () => createTimelineLoader(pool, [relay], [{ kinds: [kinds.GiftWrap], "#p": [pubkey] }], { eventStore }),
    [relay, pubkey],
  );

  useEffect(() => {
    loader$().subscribe();
  }, [loader$]);

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="flex gap-4 mb-4">
        <RelayPicker value={relay} onChange={setRelay} />
        <select
          className="select select-bordered"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
        >
          <option value="all">All Events</option>
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
      </div>

      {events.map((event) => (
        <GiftWrapEvent key={event.id} event={event} signer={signer} />
      ))}
    </div>
  );
}

export default function App() {
  const storage = use$(storage$);
  const signer = use$(signer$);
  const pubkey = use$(pubkey$);

  const handleUnlock = async (storage: SecureStorage, pubkey?: string) => {
    storage$.next(storage);

    if (pubkey) {
      pubkey$.next(pubkey);
      signer$.next(new ExtensionSigner());
    }
  };
  const handleLogin = async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
    if (storage) await storage.setItem("pubkey", pubkey);
  };

  // Show unlock view if storage is not initialized
  if (!storage) return <UnlockView onUnlock={handleUnlock} />;

  // Show login view if not logged in
  if (!signer || !pubkey) return <LoginView onLogin={handleLogin} />;

  // Show main app view when both storage and login are ready
  return <HomeView pubkey={pubkey} signer={signer} />;
}
