/**
 * Display nutzap information on user profiles with mint details
 * @tags nip-61, nutzap, profile, lightning
 * @related nutzap/zap-feed, nutzap/contacts
 */
import { MintQuoteBolt11Response, Wallet } from "@cashu/cashu-ts";
import { ActionRunner } from "applesauce-actions";
import { EventStore, mapEventsToStore, mapEventsToTimeline } from "applesauce-core";
import { getDisplayName, getProfilePicture, getSeenRelays, mergeRelaySets } from "applesauce-core/helpers";
import { NostrEvent } from "applesauce-core/helpers/event";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { NutzapProfile } from "applesauce-wallet/actions";
import {
  getNutzapInfoMints,
  getNutzapInfoPubkey,
  getNutzapInfoRelays,
  IndexedDBCouch,
  NUTZAP_INFO_KIND,
} from "applesauce-wallet/helpers";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useState } from "react";
import { map } from "rxjs";
import QRCode from "../../components/qr-code";
import RelayPicker from "../../components/relay-picker";

// Global state
const eventStore = new EventStore();
const pool = new RelayPool();
const signer = new ExtensionSigner();
const actions = new ActionRunner(eventStore, signer, (event, relays) => pool.publish(relays ?? [], event));
const couch = new IndexedDBCouch();

// Create an address loader to load user profiles
// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  // Fallback to lookup relays if profiles cant be found
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Timeline item component for displaying nutzap info events
function TimelineItem({
  nutzapInfo,
  onSelect,
}: {
  nutzapInfo: NostrEvent;
  onSelect: (nutzapInfo: NostrEvent) => void;
}) {
  const mints = getNutzapInfoMints(nutzapInfo);

  // Load the actual profile data
  const profile = use$(
    () => eventStore.profile({ pubkey: nutzapInfo.pubkey, relays: mergeRelaySets(getSeenRelays(nutzapInfo)) }),
    [nutzapInfo],
  );

  const displayName = getDisplayName(profile) || npubEncode(nutzapInfo.pubkey);
  const picture = getProfilePicture(profile, `https://robohash.org/${nutzapInfo.pubkey}.png`);

  return (
    <div
      className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(nutzapInfo)}
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              <img src={picture} alt={displayName} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{displayName}</h3>
            <p className="text-xs opacity-70 truncate">{npubEncode(nutzapInfo.pubkey)}</p>
          </div>
          <div className="text-right">
            <div className="badge badge-primary">
              {mints.length} mint{mints.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile card component
function ProfileCard({ nutzapInfo }: { nutzapInfo: NostrEvent }) {
  const mints = getNutzapInfoMints(nutzapInfo);
  const relays = getNutzapInfoRelays(nutzapInfo);
  const nutzapPubkey = getNutzapInfoPubkey(nutzapInfo);

  // Load the actual profile data
  const profile = use$(
    () => eventStore.profile({ pubkey: nutzapInfo.pubkey, relays: mergeRelaySets(getSeenRelays(nutzapInfo)) }),
    [nutzapInfo],
  );

  const displayName = getDisplayName(profile) || npubEncode(nutzapInfo.pubkey);
  const picture = getProfilePicture(profile, `https://robohash.org/${nutzapInfo.pubkey}.png`);

  return (
    <div className="card bg-base-100 shadow-md max-w-xl mx-auto">
      <div className="card-body">
        <div className="flex items-center gap-4 mb-4">
          <div className="avatar">
            <div className="w-16 rounded-full">
              <img src={picture} alt={displayName} />
            </div>
          </div>
          <div>
            <h2 className="card-title">{displayName}</h2>
            <p className="text-sm opacity-70">{npubEncode(nutzapInfo.pubkey)}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Nutzap Pubkey:</h3>
          <div className="text-sm bg-base-200 rounded px-2 py-1 font-mono">
            {nutzapPubkey ? nutzapPubkey : "Not specified"}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Supported Mints:</h3>
          <div className="space-y-1">
            {mints.map((mint, i) => (
              <div key={i} className="text-sm bg-base-200 rounded px-2 py-1">
                {mint.mint}
                {mint.units && mint.units.length > 0 && (
                  <span className="ml-2 text-xs opacity-70">({mint.units.join(", ")})</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Relays:</h3>
          <div className="space-y-1">
            {relays.map((relay, i) => (
              <div key={i} className="text-sm bg-base-200 rounded px-2 py-1">
                {relay}
              </div>
            ))}
          </div>
        </div>

        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => (document.getElementById("zap_modal") as HTMLDialogElement)?.showModal()}
            disabled={!nutzapPubkey || mints.length === 0}
          >
            ⚡ Zap Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// QR Code component for lightning invoice
function InvoiceQRCode({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCode value={value} size={192} className="h-48 w-48" alt="Lightning invoice QR code" />
      </div>
      <div className="text-center">
        <p className="text-sm font-mono break-all bg-base-200 p-2 rounded">{value}</p>
      </div>
    </div>
  );
}

// Zap modal component
function ZapModal({ nutzapInfo, onZapSent }: { nutzapInfo: NostrEvent; onZapSent?: () => void }) {
  const [amount, setAmount] = useState(21);
  const [comment, setComment] = useState("");
  const [selectedMint, setSelectedMint] = useState<string>("");
  const [quote, setQuote] = useState<MintQuoteBolt11Response | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"input" | "invoice" | "paid">("input");

  const mints = getNutzapInfoMints(nutzapInfo);
  const rawNutzapPubkey = getNutzapInfoPubkey(nutzapInfo);
  // Set default selected mint when mints change
  useEffect(() => {
    if (mints.length > 0) {
      // If no mint is selected or the selected mint is not in the current mints, select the first one
      if (!selectedMint || !mints.some((m) => m.mint === selectedMint)) {
        setSelectedMint(mints[0].mint);
      }
    }
  }, [mints, selectedMint]);

  // Ensure pubkey is properly prefixed with "02" for NIP-61 compliance
  const nutzapPubkey = rawNutzapPubkey
    ? rawNutzapPubkey.length === 64
      ? `02${rawNutzapPubkey}`
      : rawNutzapPubkey
    : null;

  const handleZap = async () => {
    if (!selectedMint || !nutzapPubkey) {
      alert("Profile doesn't have proper nutzap info");
      return;
    }

    setIsProcessing(true);
    try {
      // Create mint and wallet
      const wallet = new Wallet(selectedMint);
      await wallet.loadMint(); // Load mint keys

      // Request a quote for minting
      const quote = await wallet.createMintQuoteBolt11(amount);
      setQuote(quote);
      setStatus("invoice");

      // Wait for payment using WebSocket (5 minute timeout)
      try {
        await wallet.on.onceMintPaid(quote.quote, {
          timeoutMs: 60_000, // 1 minute
        });

        // Payment received - mint proofs with P2PK lock using the new wallet.ops API
        const proofs = await wallet.ops.mintBolt11(amount, quote.quote).asP2PK({ pubkey: nutzapPubkey }).run();

        // Create token from proofs
        const tokens = { mint: selectedMint, proofs: proofs, unit: "sat" };

        // Create and publish the nutzap event to the recipient's advertised relays.
        await actions.run(NutzapProfile, nutzapInfo.pubkey, tokens, { comment, couch });

        setStatus("paid");
        onZapSent?.();
      } catch (paymentError) {
        const errorMessage = (paymentError as Error).message;
        if (errorMessage.includes("Timeout") || errorMessage.includes("timeout")) {
          console.error("Payment timeout:", paymentError);
          alert("Payment not received within 5 minutes");
        } else {
          console.error("Payment failed:", paymentError);
          alert("Failed to receive payment: " + errorMessage);
        }
      }
    } catch (error) {
      console.error("Zap failed:", error);
      alert("Failed to create zap: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <dialog id="zap_modal" className="modal">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Zap Profile</h2>
          <form method="dialog">
            <button className="btn btn-circle btn-ghost">✕</button>
          </form>
        </div>

        {status === "input" && (
          <div className="space-y-4">
            <div>
              <label className="label">Mint</label>
              <select
                className="select select-bordered w-full"
                value={selectedMint}
                onChange={(e) => setSelectedMint(e.target.value)}
                disabled={mints.length === 0}
              >
                {mints.length === 0 ? (
                  <option value="">No mints available</option>
                ) : (
                  mints.map((mint, i) => (
                    <option key={i} value={mint.mint}>
                      {mint.mint}
                      {mint.units && mint.units.length > 0 && ` (${mint.units.join(", ")})`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="label">Amount (sats)</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
              />
            </div>

            <div>
              <label className="label">Comment (optional)</label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Say something nice..."
              />
            </div>

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost">Cancel</button>
              </form>
              <button onClick={handleZap} className="btn btn-primary" disabled={isProcessing || !selectedMint}>
                {isProcessing ? "Processing..." : "Create Zap"}
              </button>
            </div>
          </div>
        )}

        {status === "invoice" && quote && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Pay Invoice</h3>
              <p className="text-sm opacity-70 mb-4">Scan the QR code or copy the invoice to pay {amount} sats</p>
            </div>

            <InvoiceQRCode value={quote.request} />

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost">Cancel</button>
              </form>
            </div>
          </div>
        )}

        {status === "paid" && (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-4xl">✅</div>
            <h3 className="text-lg font-semibold">Zap Sent!</h3>
            <p className="text-sm opacity-70">Your nutzap has been successfully sent to the profile</p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-primary">Done</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

export default function ZapProfile() {
  const [selectedNutzapInfo, setSelectedNutzapInfo] = useState<NostrEvent | null>(null);
  const [relay, setRelay] = useState<string>("wss://relay.primal.net/");

  // Create a timeline observable for NUTZAP_INFO_KIND events
  const timeline = use$(() => {
    if (relay.length === 0) return undefined;

    return pool
      .relay(relay)
      .subscription({
        kinds: [NUTZAP_INFO_KIND],
      })
      .pipe(
        // deduplicate events using the event store
        mapEventsToStore(eventStore),
        // collect all events into a timeline
        mapEventsToTimeline(),
        // Duplicate the timeline array to make react happy
        map((t) => [...t]),
      );
  }, [relay]);

  return (
    <div className="container mx-auto my-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nutzap Profile</h1>
      </div>

      {selectedNutzapInfo ? (
        <div className="space-y-4">
          <button className="btn" onClick={() => setSelectedNutzapInfo(null)}>
            ← Back to timeline
          </button>
          <ProfileCard nutzapInfo={selectedNutzapInfo} />
          <ZapModal
            nutzapInfo={selectedNutzapInfo}
            onZapSent={() => {
              // Optionally close modal or show success
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Relay Selection */}
          <RelayPicker value={relay} onChange={setRelay} className="flex-1" />

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Recent Nutzap Profiles</h2>
            <p className="text-sm opacity-70">Click on a profile to view details and zap them</p>
          </div>

          {!timeline && relay.length > 0 && (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4">Loading nutzap profiles...</p>
            </div>
          )}

          {relay.length === 0 && (
            <div className="text-center py-8">
              <div className="alert alert-warning max-w-md mx-auto">
                <span>Please add at least one relay to query for nutzap profiles.</span>
              </div>
            </div>
          )}

          {timeline && timeline.length === 0 && relay.length > 0 && (
            <div className="text-center py-8">
              <div className="alert alert-info max-w-md mx-auto">
                <span>No nutzap profiles found. Profiles will appear here as they are discovered.</span>
              </div>
            </div>
          )}

          {timeline && timeline.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeline.map((nutzapInfo) => (
                <TimelineItem key={nutzapInfo.id} nutzapInfo={nutzapInfo} onSelect={setSelectedNutzapInfo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
