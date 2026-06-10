/**
 * Generate gift-wrapped events (NIP-59) with encryption for private sharing
 * @tags gift-wrap, generator, encryption, nip-59
 * @related gift-wrap/dashboard, gift-wrap/timeline
 */
import { randomBytes } from "@noble/hashes/utils";
import { defined, EventStore } from "applesauce-core";
import { normalizeToPubkey } from "applesauce-core/helpers";
import { nip44 } from "applesauce-core/helpers/encryption";
import { finalizeEvent, getEventHash, kinds, NostrEvent, UnsignedEvent } from "applesauce-core/helpers/event";
import { generateSecretKey } from "applesauce-core/helpers/keys";
import { unixNow } from "applesauce-core/helpers/time";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { PublishResponse, RelayPool } from "applesauce-relay";
import { PrivateKeySigner } from "applesauce-signers";
import { useState } from "react";
import { BehaviorSubject, switchMap } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

const totalRandomUsers = [
  "npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s",
  "npub18ams6ewn5aj2n3wt2qawzglx9mr4nzksxhvrdc4gzrecw7n5tvjqctp424",
  "npub1uac67zc9er54ln0kl6e4qp2y6ta3enfcg7ywnayshvlw9r5w6ehsqq99rx",
  "npub1gcxzte5zlkncx26j68ez60fzkvtkm9e0vrwdcvsjakxf9mu9qewqlfnj5z",
  "npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx",
  "npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr",
  "npub1zuuajd7u3sx8xu92yav9jwxpr839cs0kc3q6t56vd5u9q033xmhsk6c2uc",
].map(normalizeToPubkey);

const pubkey$ = new BehaviorSubject<string | null>(
  totalRandomUsers[Math.floor(Math.random() * totalRandomUsers.length)],
);
const pool = new RelayPool();
const eventStore = new EventStore();
const signer = new PrivateKeySigner();

// Create an address loader to load user profiles and replaceable events
// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  // Fallback to lookup relays if events can't be found
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
});

const mailboxes$ = pubkey$.pipe(
  defined(),
  switchMap((pubkey) => eventStore.mailboxes(pubkey)),
);

/** Types of broken gift wraps */
export enum BrokenGiftWrapType {
  BrokenGiftWrap = "broken-gift-wrap",
  BrokenSealInGiftWrap = "broken-seal-in-gift-wrap",
  RandomSealKindInGiftWrap = "random-seal-kind-in-gift-wrap",
  BrokenRumorInSealInGiftWrap = "broken-rumor-in-seal-in-gift-wrap",
  RandomRumorKind = "random-rumor-kind",
  NIP17DMWithRandomBase64 = "nip17-dm-with-random-base64",
}

/** Generates random base64 encoded data of random length */
function generateRandomBase64Data(): string {
  // Random length between 10 and 1000 bytes
  const length = Math.floor(Math.random() * 9990) + 10;
  const randomData = randomBytes(length);

  // Convert Uint8Array to base64 using browser's btoa
  // Convert bytes to binary string first
  let binary = "";
  for (let i = 0; i < randomData.length; i++) {
    binary += String.fromCharCode(randomData[i]);
  }
  return btoa(binary);
}

type EventStatus = {
  event: NostrEvent;
  relayStatuses: Map<string, { ok: boolean; message?: string }>;
  index: number;
};

type DelayConfigProps = {
  minDelay: number;
  maxDelay: number;
  onMinDelayChange: (value: number) => void;
  onMaxDelayChange: (value: number) => void;
};

function DelayConfigInput({ minDelay, maxDelay, onMinDelayChange, onMaxDelayChange }: DelayConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Min Delay (ms)</span>
        </label>
        <input
          type="number"
          min="0"
          max="10000"
          className="input input-bordered w-full"
          value={minDelay}
          onChange={(e) => onMinDelayChange(Math.max(0, parseInt(e.target.value) || 0))}
        />
        <label className="label">
          <span className="label-text-alt">Minimum delay between events</span>
        </label>
      </div>
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Max Delay (ms)</span>
        </label>
        <input
          type="number"
          min="0"
          max="10000"
          className="input input-bordered w-full"
          value={maxDelay}
          onChange={(e) => onMaxDelayChange(Math.max(0, parseInt(e.target.value) || 0))}
        />
        <label className="label">
          <span className="label-text-alt">Maximum delay between events</span>
        </label>
      </div>
    </div>
  );
}

type RelayStatusItemProps = {
  relay: string;
  status: { ok: boolean; message?: string };
};

function RelayStatusItem({ relay, status }: RelayStatusItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-mono ${
          status.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {status.ok ? "✓" : "✗"}
      </span>
      <span className="text-xs text-base-content/70 truncate flex-1">{relay}</span>
      {status.message && <span className="text-xs text-base-content/50">{status.message}</span>}
    </div>
  );
}

type RelayStatusListProps = {
  relayStatuses: Map<string, { ok: boolean; message?: string }>;
};

function RelayStatusList({ relayStatuses }: RelayStatusListProps) {
  return (
    <div className="mt-2 space-y-1">
      <div className="text-xs font-semibold text-base-content/70 mb-1">Relay Status:</div>
      {Array.from(relayStatuses.entries()).map(([relay, status]) => (
        <RelayStatusItem key={relay} relay={relay} status={status} />
      ))}
    </div>
  );
}

type EventStatusCardProps = {
  status: EventStatus;
  isPublishing: boolean;
};

function EventStatusCard({ status, isPublishing }: EventStatusCardProps) {
  return (
    <div className="bg-base-200 p-3 rounded">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-mono text-base-content/70">
          Event #{status.index + 1}
          {isPublishing && <span className="ml-2 text-primary">(Publishing...)</span>}
        </span>
        <span className="text-xs text-base-content/50">{status.event.id.slice(0, 16)}...</span>
      </div>
      <div className="text-xs font-mono break-all mb-2">
        <div className="mb-1">
          <span className="text-base-content/70">Content length: </span>
          <span className="text-base-content">{status.event.content.length} chars</span>
        </div>
        <div className="text-base-content/50 break-all">{status.event.content.slice(0, 100)}...</div>
      </div>
      <RelayStatusList relayStatuses={status.relayStatuses} />
    </div>
  );
}

type EventStatusListProps = {
  eventStatuses: EventStatus[];
  currentEventIndex: number | null;
  totalCount: number;
};

function EventStatusList({ eventStatuses, currentEventIndex, totalCount }: EventStatusListProps) {
  if (eventStatuses.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">
        Published Events ({eventStatuses.length}/{totalCount})
      </h3>
      <div className="flex flex-col-reverse gap-2 max-h-lg overflow-y-auto">
        {eventStatuses.map((status) => (
          <EventStatusCard key={status.event.id} status={status} isPublishing={currentEventIndex === status.index} />
        ))}
      </div>
    </div>
  );
}

type InboxRelayInfoProps = {
  pubkey: string | null;
  inboxCount: number | null;
  inboxes: string[] | null;
};

function InboxRelayInfo({ pubkey, inboxCount, inboxes }: InboxRelayInfoProps) {
  if (!pubkey || pubkey.length !== 64) return null;

  return (
    <div className="alert mb-4">
      <span>
        {inboxes && inboxCount
          ? `Found ${inboxCount} inbox relay(s): ${inboxes.join(", ")}`
          : "Loading inbox relays..."}
      </span>
    </div>
  );
}

type GenerateButtonProps = {
  generating: boolean;
  currentEventIndex: number | null;
  totalCount: number;
  disabled: boolean;
  onClick: () => void;
};

function GenerateButton({ generating, currentEventIndex, totalCount, disabled, onClick }: GenerateButtonProps) {
  const buttonText = generating
    ? currentEventIndex !== null
      ? `Publishing event ${currentEventIndex + 1}/${totalCount}...`
      : "Generating..."
    : `Generate ${totalCount} Broken Event${totalCount !== 1 ? "s" : ""}`;

  return (
    <div className="card-actions justify-end">
      <button className="btn btn-primary" onClick={onClick} disabled={disabled}>
        {buttonText}
      </button>
    </div>
  );
}

type BrokenTypeSelectorProps = {
  selectedType: BrokenGiftWrapType;
  onTypeChange: (type: BrokenGiftWrapType) => void;
};

function BrokenTypeSelector({ selectedType, onTypeChange }: BrokenTypeSelectorProps) {
  const types = [
    {
      value: BrokenGiftWrapType.BrokenGiftWrap,
      label: "Broken Gift Wrap",
      description: "Random base64 content in gift wrap - tests gift wrap decryption failure",
    },
    {
      value: BrokenGiftWrapType.BrokenSealInGiftWrap,
      label: "Broken Seal in Gift Wrap",
      description: "Valid gift wrap encryption, but encrypted content is random base64 instead of valid seal JSON",
    },
    {
      value: BrokenGiftWrapType.RandomSealKindInGiftWrap,
      label: "Random Seal Kind in Gift Wrap",
      description: "Valid gift wrap with seal that has wrong kind (not 13) - tests seal validation",
    },
    {
      value: BrokenGiftWrapType.BrokenRumorInSealInGiftWrap,
      label: "Broken Rumor in Seal in Gift Wrap",
      description: "Valid gift wrap and seal, but rumor content is random base64 instead of valid JSON",
    },
    {
      value: BrokenGiftWrapType.RandomRumorKind,
      label: "Random Rumor Kind",
      description: "Valid gift wrap and seal, but rumor has wrong kind (not 14) - tests rumor validation",
    },
    {
      value: BrokenGiftWrapType.NIP17DMWithRandomBase64,
      label: "NIP-17 DM with Random Base64",
      description:
        "Valid gift wrap, seal, and rumor (kind 14), but rumor content is random base64 instead of valid message",
    },
  ];

  return (
    <div className="form-control w-full mb-4">
      <label className="label">
        <span className="label-text">Broken Type</span>
      </label>
      <select
        className="select select-bordered w-full"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value as BrokenGiftWrapType)}
      >
        {types.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      <label className="label">
        <span className="label-text-alt">{types.find((t) => t.value === selectedType)?.description}</span>
      </label>
    </div>
  );
}

/** Generator functions for different broken gift wrap types */
async function generateBrokenGiftWrap(pubkey: string): Promise<NostrEvent> {
  const key = generateSecretKey();
  const randomContent = generateRandomBase64Data();
  const event = finalizeEvent(
    {
      kind: kinds.GiftWrap,
      created_at: unixNow(),
      content: randomContent, // Broken: random base64 data instead of valid encrypted content
      tags: [["p", pubkey]],
    },
    key,
  );

  return event;
}

async function generateBrokenSealInGiftWrap(pubkey: string): Promise<NostrEvent> {
  // Create valid gift wrap encryption but with random base64 as seal content
  const key = generateSecretKey();
  const brokenSealContent = generateRandomBase64Data();

  const draft = {
    kind: kinds.GiftWrap,
    created_at: unixNow(),
    content: nip44.encrypt(brokenSealContent, nip44.getConversationKey(key, pubkey)),
    tags: [["p", pubkey]],
  };

  return finalizeEvent(draft, key);
}

async function generateRandomSealKindInGiftWrap(pubkey: string): Promise<NostrEvent> {
  // Create a seal with wrong kind (use kind 1 instead of 13)
  const senderPubkey = await signer.getPublicKey();
  const brokenSeal: UnsignedEvent = {
    kind: Math.floor(Math.random() * 1000), // Wrong kind - should be 13
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: "",
    tags: [],
  };

  // Sign the broken seal
  const signedSeal = await signer.signEvent(brokenSeal);

  // Encrypt the broken seal in gift wrap
  const key = generateSecretKey();
  const plaintext = JSON.stringify(signedSeal);
  const draft = {
    kind: kinds.GiftWrap,
    created_at: unixNow(),
    content: nip44.encrypt(plaintext, nip44.getConversationKey(key, pubkey)),
    tags: [["p", pubkey]],
  };

  return finalizeEvent(draft, key);
}

async function generateBrokenRumorInSealInGiftWrap(pubkey: string): Promise<NostrEvent> {
  // Create a rumor with random base64 content
  const senderPubkey = await signer.getPublicKey();
  const brokenRumor: UnsignedEvent = {
    kind: kinds.PrivateDirectMessage,
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: generateRandomBase64Data(), // Broken: random base64 instead of valid message
    tags: [["p", pubkey]],
  };

  const rumorId = getEventHash(brokenRumor);
  const rumorWithId = { ...brokenRumor, id: rumorId };

  // Seal the broken rumor
  const rumorPlaintext = JSON.stringify(rumorWithId);
  if (!signer.nip44) throw new Error("Signer with nip44 required");
  const encrypted = await signer.nip44.encrypt(pubkey, rumorPlaintext);

  const sealDraft: UnsignedEvent = {
    kind: kinds.Seal,
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: encrypted,
    tags: [],
  };

  const seal = await signer.signEvent(sealDraft);

  // Wrap the seal in gift wrap
  const key = generateSecretKey();
  const sealPlaintext = JSON.stringify(seal);
  const giftDraft = {
    kind: kinds.GiftWrap,
    created_at: unixNow(),
    content: nip44.encrypt(sealPlaintext, nip44.getConversationKey(key, pubkey)),
    tags: [["p", pubkey]],
  };

  return finalizeEvent(giftDraft, key);
}

async function generateRandomRumorKind(pubkey: string): Promise<NostrEvent> {
  // Create a rumor with wrong kind (use kind 1 instead of 14)
  const senderPubkey = await signer.getPublicKey();
  const brokenRumor: UnsignedEvent = {
    kind: Math.floor(Math.random() * 1000), // Wrong kind - should be 14
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: generateRandomBase64Data(),
    tags: [["p", pubkey]],
  };

  const rumorId = getEventHash(brokenRumor);
  const rumorWithId = { ...brokenRumor, id: rumorId };

  // Seal the broken rumor
  const rumorPlaintext = JSON.stringify(rumorWithId);
  if (!signer.nip44) throw new Error("Signer with nip44 required");
  const encrypted = await signer.nip44.encrypt(pubkey, rumorPlaintext);

  const sealDraft: UnsignedEvent = {
    kind: kinds.Seal,
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: encrypted,
    tags: [],
  };

  const seal = await signer.signEvent(sealDraft);

  // Wrap the seal in gift wrap
  const key = generateSecretKey();
  const sealPlaintext = JSON.stringify(seal);
  const giftDraft = {
    kind: kinds.GiftWrap,
    created_at: unixNow(),
    content: nip44.encrypt(sealPlaintext, nip44.getConversationKey(key, pubkey)),
    tags: [["p", pubkey]],
  };

  return finalizeEvent(giftDraft, key);
}

async function generateNIP17DMWithRandomBase64(pubkey: string): Promise<NostrEvent> {
  // Create a valid rumor structure (kind 14) but with random base64 content
  const senderPubkey = await signer.getPublicKey();
  const brokenRumor: UnsignedEvent = {
    kind: kinds.PrivateDirectMessage,
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: generateRandomBase64Data(), // Broken: random base64 instead of valid message
    tags: [["p", pubkey]],
  };

  const rumorId = getEventHash(brokenRumor);
  const rumorWithId = { ...brokenRumor, id: rumorId };

  // Seal the broken rumor
  const rumorPlaintext = JSON.stringify(rumorWithId);
  if (!signer.nip44) throw new Error("Signer with nip44 required");
  const encrypted = await signer.nip44.encrypt(pubkey, rumorPlaintext);

  const sealDraft: UnsignedEvent = {
    kind: kinds.Seal,
    pubkey: senderPubkey,
    created_at: unixNow(),
    content: encrypted,
    tags: [],
  };

  const seal = await signer.signEvent(sealDraft);

  // Wrap the seal in gift wrap
  const key = generateSecretKey();
  const sealPlaintext = JSON.stringify(seal);
  const giftDraft = {
    kind: kinds.GiftWrap,
    created_at: unixNow(),
    content: nip44.encrypt(sealPlaintext, nip44.getConversationKey(key, pubkey)),
    tags: [["p", pubkey]],
  };

  return finalizeEvent(giftDraft, key);
}

export default function BrokenGiftWrapGenerator() {
  const pubkey = use$(pubkey$);
  const [count, setCount] = useState<number>(100);
  const [minDelay, setMinDelay] = useState<number>(100);
  const [maxDelay, setMaxDelay] = useState<number>(1000);
  const [brokenType, setBrokenType] = useState<BrokenGiftWrapType>(BrokenGiftWrapType.BrokenGiftWrap);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eventStatuses, setEventStatuses] = useState<EventStatus[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState<number | null>(null);

  const mailboxes = use$(mailboxes$);

  const handleGenerate = async () => {
    if (!pubkey) return;
    if (!mailboxes?.inboxes?.length) {
      setError("No inbox relays found for this pubkey. The user may not have published a relay list (kind 10002).");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      setEventStatuses([]);
      setCurrentEventIndex(null);

      const statuses: EventStatus[] = [];
      // Track failed relays - once a relay fails, don't try it again
      const failedRelays = new Set<string>();
      // Start with all inbox relays as available
      let availableRelays = [...mailboxes.inboxes];

      for (let i = 0; i < count; i++) {
        // Filter out failed relays
        availableRelays = availableRelays.filter((relay) => !failedRelays.has(relay));

        // If no relays are available, stop publishing
        if (availableRelays.length === 0) {
          setError(`All relays have failed. Stopped publishing after ${i} event(s).`);
          break;
        }

        setCurrentEventIndex(i);

        // Generate broken gift wrap event based on selected type
        let signed: NostrEvent;
        switch (brokenType) {
          case BrokenGiftWrapType.BrokenGiftWrap:
            signed = await generateBrokenGiftWrap(pubkey);
            break;
          case BrokenGiftWrapType.BrokenSealInGiftWrap:
            signed = await generateBrokenSealInGiftWrap(pubkey);
            break;
          case BrokenGiftWrapType.RandomSealKindInGiftWrap:
            signed = await generateRandomSealKindInGiftWrap(pubkey);
            break;
          case BrokenGiftWrapType.BrokenRumorInSealInGiftWrap:
            signed = await generateBrokenRumorInSealInGiftWrap(pubkey);
            break;
          case BrokenGiftWrapType.RandomRumorKind:
            signed = await generateRandomRumorKind(pubkey);
            break;
          case BrokenGiftWrapType.NIP17DMWithRandomBase64:
            signed = await generateNIP17DMWithRandomBase64(pubkey);
            break;
          default:
            signed = await generateBrokenGiftWrap(pubkey);
        }

        // Initialize relay statuses for this event (only for available relays)
        const relayStatuses = new Map<string, { ok: boolean; message?: string }>();
        availableRelays.forEach((relay) => {
          relayStatuses.set(relay, { ok: false });
        });
        // Also show failed relays as skipped
        failedRelays.forEach((relay) => {
          relayStatuses.set(relay, { ok: false, message: "Skipped (previously failed)" });
        });

        const eventStatus: EventStatus = {
          event: signed,
          relayStatuses,
          index: i,
        };

        statuses.push(eventStatus);
        setEventStatuses([...statuses]);

        // Publish event to available relays only
        // Collect all responses and update status as they come in
        const responses: PublishResponse[] = [];
        await new Promise<void>((resolve) => {
          const subscription = pool.event(availableRelays, signed).subscribe({
            next: (response) => {
              // Update status for this relay
              relayStatuses.set(response.from, {
                ok: response.ok,
                message: response.message,
              });
              responses.push(response);

              // If the relay failed, add it to the failed set
              if (!response.ok) {
                failedRelays.add(response.from);
              }

              // Update state to trigger re-render
              setEventStatuses([...statuses]);

              // Check if we've received responses from all available relays
              if (responses.length >= availableRelays.length) {
                subscription.unsubscribe();
                resolve();
              }
            },
            error: (err) => {
              console.error("Error publishing event:", err);
              // Mark all remaining relays as failed and add them to failed set
              availableRelays.forEach((relay) => {
                if (!responses.some((r) => r.from === relay)) {
                  relayStatuses.set(relay, {
                    ok: false,
                    message: err instanceof Error ? err.message : "Unknown error",
                  });
                  failedRelays.add(relay);
                }
              });
              setEventStatuses([...statuses]);
              subscription.unsubscribe();
              resolve(); // Resolve instead of reject to continue with next event
            },
            complete: () => {
              // If complete is called but we haven't received all responses,
              // mark remaining relays as failed and add them to failed set
              availableRelays.forEach((relay) => {
                if (!responses.some((r) => r.from === relay)) {
                  relayStatuses.set(relay, {
                    ok: false,
                    message: "No response received",
                  });
                  failedRelays.add(relay);
                }
              });
              setEventStatuses([...statuses]);
              resolve();
            },
          });
        });

        // Random delay between events (except for the last one)
        if (i < count - 1) {
          const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      setCurrentEventIndex(null);
      const successCount = statuses.reduce(
        (sum, status) => sum + Array.from(status.relayStatuses.values()).filter((s) => s.ok).length,
        0,
      );
      const totalAttempts = statuses.reduce((sum, status) => sum + Array.from(status.relayStatuses.values()).length, 0);
      setSuccess(
        `Successfully published ${successCount} out of ${totalAttempts} event(s) to ${mailboxes.inboxes.length} inbox relay(s)`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate broken gift wrap events";
      setError(errorMessage);
      console.error("Failed to generate broken gift wrap events:", err);
    } finally {
      setGenerating(false);
      setCurrentEventIndex(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Broken Gift Wrap Generator</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Generate broken gift wrap events with random base64 data to stress test the gift wrapping system. These
            events will fail to decrypt, testing error handling and resilience. Events will be published to the target
            user's inbox relays.
          </p>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Target Pubkey</span>
            </label>
            <PubkeyPicker
              value={pubkey ?? ""}
              onChange={(pubkey) => pubkey$.next(pubkey)}
              placeholder="Enter pubkey or nostr identifier..."
            />
            <label className="label">
              <span className="label-text-alt">
                The pubkey that will receive the broken gift wrap events. Inbox relays will be loaded automatically.
              </span>
            </label>
          </div>

          <InboxRelayInfo
            pubkey={pubkey}
            inboxCount={mailboxes?.inboxes?.length ?? null}
            inboxes={mailboxes?.inboxes ?? null}
          />

          <BrokenTypeSelector selectedType={brokenType} onTypeChange={setBrokenType} />

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Number of Events</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="input input-bordered w-full"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            />
            <label className="label">
              <span className="label-text-alt">Generate between 1 and 100 broken events</span>
            </label>
          </div>

          <DelayConfigInput
            minDelay={minDelay}
            maxDelay={maxDelay}
            onMinDelayChange={setMinDelay}
            onMaxDelayChange={setMaxDelay}
          />

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          <GenerateButton
            generating={generating}
            currentEventIndex={currentEventIndex}
            totalCount={count}
            disabled={generating || !pubkey || !mailboxes?.inboxes?.length}
            onClick={handleGenerate}
          />

          <EventStatusList eventStatuses={eventStatuses} currentEventIndex={currentEventIndex} totalCount={count} />
        </div>
      </div>
    </div>
  );
}
