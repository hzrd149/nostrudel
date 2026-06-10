/**
 * Zap modal example showing how to fetch a lightning invoice and display it as a QR code
 * @description Renders a note and lets you zap it via a modal with amount presets, lightning address lookup, QR invoice, and zap receipt detection
 * @tags nip-57, zap, lightning, modal, qrcode, invoice
 * @related zap/timeline, zap/graph, nwc/simple-wallet
 */
import { castEvent, Note, Zap } from "applesauce-common/casts";
import { User } from "applesauce-common/casts/user";
import { ZapRequestFactory } from "applesauce-common/factories";
import { parseBolt11, parseLNURLOrAddress } from "applesauce-common/helpers";
import { castEventStream } from "applesauce-common/observable";
import { Link } from "applesauce-content/nast";
import { defined, EventStore, mapEventsToStore } from "applesauce-core";
import {
  decodeEventPointer,
  Filter,
  isAudioURL,
  isImageURL,
  isVideoURL,
  kinds,
  NostrEvent,
  relaySet,
  safeParse,
} from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { ComponentMap, use$, useRenderedContent } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { ExtensionSigner } from "applesauce-signers";
import { SerializedWalletConnect, WalletConnect } from "applesauce-wallet-connect";
import { ZapIcon } from "lucide-react";
import { generateSecretKey } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, map, startWith, Subscription } from "rxjs";
import QRCode from "../../components/qr-code";
import RelayPicker from "../../components/relay-picker";

// --- Setup ---
const eventStore = new EventStore();
const pool = new RelayPool();
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: relaySet(["purplepag.es", "index.hzrd149.com", "indexer.coracle.social"]),
});

const signer = new ExtensionSigner();

// --- Application state ---

const storedWallet = safeParse<SerializedWalletConnect>(localStorage.getItem("wallet-connect") ?? "");
const wallet$ = new BehaviorSubject<WalletConnect | null>(
  // Load wallet connect from localstorage
  storedWallet ? WalletConnect.fromJSON(storedWallet, { pool }) : null,
);

// Save wallet connect to localstorage
wallet$.subscribe((wallet) => {
  if (wallet) localStorage.setItem("wallet-connect", JSON.stringify(wallet.toJSON()));
  else localStorage.setItem("wallet-connect", "");
});

// The nevent we want to display
const EVENTS = [
  "nevent1qvzqqqqqqypzqrtvswydevzfhrw5ljxnmrpmhy778k5sh2pguncfezks7dry3z3nqyt8wumn8ghj7etyv4hzumn0wd68ytnvv9hxgtcpz9mhxue69uhnzdps9enrw73wd9hj7qpq5yq4m0a4m2rzzfqnpxraykhjgzaejdrszzh7kr83azcw575mpf2s5psckt",
  "nevent1qvzqqqqqqypzqpxfzhdwlm3cx9l6wdzyft8w8y9gy607tqgtyfq7tekaxs7lhmxfqythwumn8ghj7un9d3shjtnswf5k6ctv9ehx2ap0qy88wumn8ghj7mn0wvhxcmmv9uqzph7axpgv0rx4ukk9cl4m6k8ryrxj37dw0at6qqv730qwdgyxr6x0hfcsp7",
  "nevent1qvzqqqqqqypzqprpljlvcnpnw3pejvkkhrc3y6wvmd7vjuad0fg2ud3dky66gaxaqydhwumn8ghj7emvv4shxmmwv96x7u3wv3jhvtmjv4kxz7gpzemhxue69uhhyetvv9ujumt0wd68ytnsw43z7qpqznc2ef9egfr5klaxdmy9kyd4k3zcl8njqhupz8p74uffm4s9y0mq0l65dp",
  "nevent1qvzqqqqqqypzqprpljlvcnpnw3pejvkkhrc3y6wvmd7vjuad0fg2ud3dky66gaxaqydhwumn8ghj7emvv4shxmmwv96x7u3wv3jhvtmjv4kxz7gpzemhxue69uhhyetvv9ujumt0wd68ytnsw43z7qpqhj78hu5u9ujfku7q4nmet6dr2pzussm9la680q6wnj4ynepy48ysusp09l",
  "nevent1qvzqqqqqqypzqyde4z2qfklnqd88uxyxh2wuf3knwmernggcyuda9mzk02yfs5xwqy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qghwaehxw309aex2mrp0yh8qunfd4skctnwv46z7qpqlprc6uc53q4ugqvp94hw5kgrpnxy6vntt0cyl4mfe5uekv57uynqy38gjw",
];
const NEVENT = EVENTS[Math.floor(Math.random() * EVENTS.length)];

// Decode the nevent to get the event pointer
const eventPointer = decodeEventPointer(NEVENT)!;

// Default relays for fetching
const DEFAULT_RELAYS = eventPointer.relays?.length
  ? eventPointer.relays
  : ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];

// Exponential slider config
const SLIDER_MIN_SATS = 1;
const SLIDER_MAX_SATS = 1_000_000;
const SLIDER_STEPS = 200;

function sliderToSats(position: number): number {
  const t = position / SLIDER_STEPS;
  return Math.round(Math.exp(Math.log(SLIDER_MIN_SATS) + (Math.log(SLIDER_MAX_SATS) - Math.log(SLIDER_MIN_SATS)) * t));
}

function satsToSlider(sats: number): number {
  return Math.round(
    ((Math.log(sats) - Math.log(SLIDER_MIN_SATS)) / (Math.log(SLIDER_MAX_SATS) - Math.log(SLIDER_MIN_SATS))) *
      SLIDER_STEPS,
  );
}

// Default slider position (~1000 sats)
const DEFAULT_SLIDER_POSITION = satsToSlider(1000);

// --- Components ---
function Avatar({ user }: { user: User }) {
  const profile = use$(user.profile$);
  return (
    <div className="avatar">
      <div className="w-12 rounded-full">
        <img src={profile?.picture ?? `https://robohash.org/${user.pubkey}.png`} />
      </div>
    </div>
  );
}

function Username({ user }: { user: User }) {
  const profile = use$(user.profile$);
  return (
    <span className="font-bold">
      {profile?.displayName ?? "unknown"}{" "}
      <span className="text-sm opacity-50">
        {profile?.dnsIdentity || `@${user.npub.slice(0, 8)}...${user.npub.slice(-4)}`}
      </span>
    </span>
  );
}

function LinkRenderer({ node: link }: { node: Link }) {
  if (isImageURL(link.href))
    return (
      <a href={link.href} target="_blank">
        <img src={link.href} className="max-h-64 rounded mt-2" alt="" />
      </a>
    );
  else if (isVideoURL(link.href)) return <video src={link.href} className="max-h-64 rounded mt-2" controls />;
  else if (isAudioURL(link.href)) return <audio src={link.href} className="rounded mt-2" controls />;
  else
    return (
      <a href={link.href} target="_blank" className="text-blue-500 hover:underline">
        {link.value}
      </a>
    );
}

const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: LinkRenderer,
  mention: ({ node }) => (
    <a href={`https://njump.me/${node.encoded}`} target="_blank" className="text-purple-500 hover:underline">
      @{node.encoded.slice(0, 8)}...
    </a>
  ),
  hashtag: ({ node }) => <span className="text-orange-500">#{node.hashtag}</span>,
  gallery: ({ node }) => (
    <div className="grid grid-cols-4 gap-1 mt-2">
      {node.links.map((src, i) => (
        <a key={i} href={src} target="_blank" className="aspect-square overflow-hidden rounded">
          <img src={src} alt="" className="w-full h-full object-cover" />
        </a>
      ))}
    </div>
  ),
};

function ZapItem({ zap }: { zap: Zap }) {
  const profile = use$(zap.sender.profile$);
  const displayName = profile?.displayName ?? profile?.name ?? zap.sender.pubkey.slice(0, 8) + "…";
  const sats = Math.round((zap.amount ?? 0) / 1000);

  return (
    <div className="flex items-center gap-2">
      <div className="avatar">
        <div className="w-6 rounded-full">
          <img src={profile?.picture ?? `https://robohash.org/${zap.sender.pubkey}.png`} />
        </div>
      </div>
      <span className="text-sm font-medium truncate">{displayName}</span>
      <span className="text-sm font-bold text-warning ml-auto whitespace-nowrap">
        <ZapIcon className="w-3 h-3 inline mr-0.5" />
        {sats.toLocaleString()}
      </span>
    </div>
  );
}

/** The note card rendered like a tweet */
function NoteCard({ note, onZap }: { note: Note; onZap: () => void }) {
  const content = useRenderedContent(note.event, components);
  const zaps = use$(note.zaps$);

  const totalSats = useMemo(
    () => (zaps ? zaps.reduce((sum, z) => sum + Math.round((z.amount ?? 0) / 1000), 0) : 0),
    [zaps],
  );

  return (
    <div className="card bg-base-100 shadow-xl max-w-4xl w-full">
      <div className="card-body">
        <div className="flex items-center gap-3">
          <Avatar user={note.author} />
          <div>
            <Username user={note.author} />
            <p className="text-sm opacity-50">{note.createdAt.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-3 text-base whitespace-pre-wrap">{content}</div>

        <div className="card-actions justify-end mt-4">
          <button className="btn btn-warning gap-2" onClick={onZap}>
            <ZapIcon />
            Zap this note
          </button>
        </div>

        {zaps && zaps.length > 0 && (
          <div className="mt-2 border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ZapIcon className="w-4 h-4 text-warning" />
              <span className="font-semibold text-sm">
                {zaps.length} zap{zaps.length !== 1 ? "s" : ""} · {totalSats.toLocaleString()} sats
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {zaps.map((zap) => (
                <ZapItem key={zap.event.id} zap={zap} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- LNURL types ---
type LNURLPayEndpoint = {
  callback: string;
  minSendable: number;
  maxSendable: number;
  allowsNostr: boolean;
  nostrPubkey?: string;
};

/** Fetch the LNURL pay endpoint for a lightning address */
async function fetchLNURLPayEndpoint(address: string): Promise<LNURLPayEndpoint> {
  const url = parseLNURLOrAddress(address);
  if (!url) throw new Error("Invalid lightning address or LNURL");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch LNURL pay endpoint: ${res.statusText}`);

  const data = await res.json();
  if (!data.callback) throw new Error("Invalid LNURL pay endpoint: missing callback");

  return {
    callback: data.callback,
    minSendable: data.minSendable ?? 1000,
    maxSendable: data.maxSendable ?? 100000000000,
    allowsNostr: !!data.allowsNostr,
    nostrPubkey: data.nostrPubkey,
  };
}

/** Fetch a bolt11 invoice from the LNURL callback */
async function fetchZapInvoice(callback: string, zapRequest: NostrEvent, amount: number): Promise<string> {
  const url = new URL(callback);
  url.searchParams.set("amount", amount.toString());
  url.searchParams.set("nostr", JSON.stringify(zapRequest));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.statusText}`);

  const data = await res.json();
  if (data.status === "ERROR") throw new Error(data.reason || "LNURL server returned an error");
  if (!data.pr) throw new Error("No invoice returned from LNURL server");

  return data.pr as string;
}

// --- Connect Wallet Step ---

function ConnectWalletStep({ onConnect, onBack }: { onConnect: (wallet: WalletConnect) => void; onBack: () => void }) {
  const [relay, setRelay] = useState("wss://relay.getalby.com/v1");
  const [pasteUri, setPasteUri] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const nwcWallet = useMemo(() => new WalletConnect({ pool, relays: [relay], secret: generateSecretKey() }), [relay]);

  const authUri = useMemo(() => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 2; // Expires after 2 hours
    return nwcWallet.getAuthURI({
      methods: ["pay_invoice"],
      name: "Zap",
      expiresAt,
    });
  }, [nwcWallet]);

  useEffect(() => {
    const controller = new AbortController();

    nwcWallet
      .waitForService(controller.signal)
      .then(() => {
        wallet$.next(nwcWallet);
        onConnect(nwcWallet);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [nwcWallet]);

  const handlePaste = (value: string) => {
    setPasteUri(value);
    setPasteError(null);

    if (!value.trim()) return;

    try {
      const w = WalletConnect.fromConnectURI(value, { pool });
      wallet$.next(w);
      onConnect(w);
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Invalid connection string");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="btn btn-sm btn-ghost" onClick={onBack}>
          &larr; Back
        </button>
        <span className="font-medium">Connect Wallet</span>
      </div>

      <p className="text-sm opacity-70">
        Scan the QR code with your NWC-compatible wallet, or paste a connection string below.
      </p>

      <div className="flex flex-col items-center gap-3">
        <QRCode
          value={authUri}
          href={authUri}
          size={200}
          className="h-50 w-50"
          alt="Wallet auth QR code"
          title="Open in wallet app"
          wrapperClassName="inline-block bg-white p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
        />
        <a href={authUri} className="btn btn-primary btn-sm">
          Open in Wallet App
        </a>
        <RelayPicker value={relay} onChange={setRelay} common={["wss://relay.getalby.com/v1"]} className="w-full" />
      </div>

      <div className="divider text-xs opacity-50">OR PASTE CONNECTION STRING</div>

      <textarea
        className="textarea textarea-bordered textarea-sm w-full font-mono"
        placeholder="nostr+walletconnect://..."
        value={pasteUri}
        onChange={(e) => handlePaste(e.target.value)}
        rows={3}
      />
      {pasteError && <p className="text-error text-sm mt-1">{pasteError}</p>}

      <div className="flex items-center justify-center gap-2 text-sm opacity-70">
        <span className="loading loading-dots loading-sm"></span>
        Waiting for wallet to connect...
      </div>
    </div>
  );
}

// --- Zap Form ---

type ZapStep =
  | "select-amount"
  | "fetching-invoice"
  | "awaiting-payment"
  | "connect-wallet"
  | "paying-with-wallet"
  | "wallet-pay-error"
  | "success"
  | "error";

function ZapForm({ note, onClose }: { note: Note; onClose: () => void }) {
  const [step, setStep] = useState<ZapStep>("select-amount");
  const [sliderPosition, setSliderPosition] = useState(DEFAULT_SLIDER_POSITION);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [lnurlEndpoint, setLnurlEndpoint] = useState<LNURLPayEndpoint | null>(null);
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [lnurlLoading, setLnurlLoading] = useState(false);
  const [lnurlError, setLnurlError] = useState<string | null>(null);
  const receiptSubRef = useRef<Subscription | null>(null);
  const wallet = use$(wallet$);

  const profile = use$(note.author.profile$);
  const inboxes = use$(note.author.inboxes$);

  useEffect(() => {
    if (!profile) return;

    const addr = profile.lud16 || profile.lud06;
    if (!addr) {
      setLnurlError("This user has no lightning address set in their profile");
      return;
    }

    setLightningAddress(addr);
    setLnurlLoading(true);
    setLnurlError(null);

    fetchLNURLPayEndpoint(addr)
      .then((endpoint) => {
        setLnurlEndpoint(endpoint);
        if (!endpoint.allowsNostr) {
          setLnurlError("This user's lightning address does not support Nostr zaps (allowsNostr is false)");
        }
      })
      .catch((err) => {
        setLnurlError(err instanceof Error ? err.message : "Failed to fetch lightning address info");
      })
      .finally(() => setLnurlLoading(false));
  }, [profile]);

  useEffect(() => {
    return () => receiptSubRef.current?.unsubscribe();
  }, []);

  const effectiveAmount = sliderToSats(sliderPosition);
  const amountMsats = effectiveAmount * 1000;

  const canZap =
    lnurlEndpoint?.allowsNostr &&
    effectiveAmount > 0 &&
    amountMsats >= (lnurlEndpoint?.minSendable ?? 0) &&
    amountMsats <= (lnurlEndpoint?.maxSendable ?? Infinity);

  const handleZap = useCallback(async () => {
    if (!lnurlEndpoint || !canZap) return;

    setStep("fetching-invoice");
    setError(null);

    try {
      const zapRelays = (inboxes || DEFAULT_RELAYS).slice(0, 5);

      const zapRequest = await ZapRequestFactory.event(note.event, amountMsats, zapRelays)
        .message(message)
        .sign(signer);

      const bolt11 = await fetchZapInvoice(lnurlEndpoint.callback, zapRequest, amountMsats);
      setInvoice(bolt11);
      setStep("awaiting-payment");

      const receiptFilter: Filter = {
        kinds: [kinds.Zap],
        "#p": [note.author.pubkey],
        "#e": [note.id],
        since: Math.floor(Date.now() / 1000) - 10,
      };

      const sub = pool
        .subscription(zapRelays, receiptFilter)
        .pipe(
          // Add zap events to store for UI updates
          mapEventsToStore(eventStore),
          // Parse zap events
          castEventStream(Zap),
          // Filter out bad zaps
          defined(),
        )
        .subscribe((zap) => {
          // Look for a zap receipt that matches our request
          if (zap.request.id === zapRequest.id) {
            setStep("success");
            sub.unsubscribe();
          }
        });

      receiptSubRef.current = sub;
    } catch (err) {
      console.error("Zap failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create zap");
      setStep("error");
    }
  }, [lnurlEndpoint, canZap, amountMsats, message, inboxes]);

  const handleWalletPay = useCallback(
    async (walletInstance?: WalletConnect) => {
      const w = walletInstance || wallet;
      if (!w || !invoice) return;

      setStep("paying-with-wallet");
      setError(null);

      try {
        await w.payInvoice(invoice);
        setStep("success");
      } catch (err) {
        console.error("Wallet pay failed:", err);
        setError(err instanceof Error ? err.message : "Failed to pay with wallet");
        setStep("wallet-pay-error");
      }
    },
    [wallet, invoice],
  );

  const handleDisconnectWallet = useCallback(() => {
    wallet$.next(null);
    setStep("awaiting-payment");
    setError(null);
  }, []);

  // Auto-pay with wallet when invoice is ready
  useEffect(() => {
    if (step === "awaiting-payment" && wallet && invoice) {
      handleWalletPay();
    }
  }, [step, wallet, invoice, handleWalletPay]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-warning"
          >
            <path
              fillRule="evenodd"
              d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
              clipRule="evenodd"
            />
          </svg>
          Zap
        </h3>
        <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
          &times;
        </button>
      </div>

      {/* Lightning address status */}
      <div className="mb-4">
        {lnurlLoading && (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <span className="loading loading-spinner loading-xs"></span>
            Loading lightning address...
          </div>
        )}
        {lightningAddress && !lnurlError && lnurlEndpoint && (
          <div className="flex items-center gap-2 text-sm">
            <span className="badge badge-success badge-sm">Lightning</span>
            <span className="font-mono text-xs">{lightningAddress}</span>
          </div>
        )}
        {lnurlError && (
          <div className="alert alert-error text-sm py-2">
            <span>{lnurlError}</span>
          </div>
        )}
        {!profile && !lnurlLoading && (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <span className="loading loading-spinner loading-xs"></span>
            Loading profile...
          </div>
        )}
      </div>

      {/* Step: Select Amount */}
      {step === "select-amount" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="label-text font-medium">Amount</span>
              <span className="text-2xl font-bold text-warning">{effectiveAmount.toLocaleString()} sats</span>
            </div>
            <input
              type="range"
              min="0"
              max={SLIDER_STEPS}
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="range range-warning range-sm w-full"
            />
            <div className="relative text-xs opacity-40 h-4">
              {(
                [
                  [1, "1"],
                  [100, "100"],
                  [1_000, "1k"],
                  [10_000, "10k"],
                  [100_000, "100k"],
                  [1_000_000, "1M"],
                ] as [number, string][]
              ).map(([sats, label]) => (
                <span
                  key={sats}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(satsToSlider(sats) / SLIDER_STEPS) * 100}%` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {lnurlEndpoint && (
            <p className="text-xs opacity-50">
              Min: {Math.ceil(lnurlEndpoint.minSendable / 1000).toLocaleString()} sats | Max:{" "}
              {Math.floor(lnurlEndpoint.maxSendable / 1000).toLocaleString()} sats
            </p>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text text-sm">Message (optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered textarea-sm w-full"
              placeholder="Say something nice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          <div className="modal-action mt-2">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-warning" onClick={handleZap} disabled={!canZap}>
              Zap {effectiveAmount.toLocaleString()} sats
            </button>
          </div>
        </div>
      )}

      {/* Step: Fetching Invoice */}
      {step === "fetching-invoice" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <span className="loading loading-spinner loading-lg text-warning"></span>
          <p className="text-sm opacity-70">Creating zap request and fetching invoice...</p>
        </div>
      )}

      {/* Step: Awaiting Payment */}
      {step === "awaiting-payment" && invoice && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium">
            Scan or click to pay <span className="text-warning font-bold">{effectiveAmount.toLocaleString()}</span> sats
          </p>

          <QRCode
            value={invoice}
            href={`lightning:${invoice}`}
            size={256}
            className="h-64 w-64"
            alt="Lightning invoice QR code"
            title="Click to open in Lightning wallet"
            wrapperClassName="inline-block bg-white p-4 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          />

          <div className="w-full">
            <div className="collapse collapse-arrow bg-base-200 rounded-lg">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">Invoice details</div>
              <div className="collapse-content">
                {(() => {
                  try {
                    const parsed = parseBolt11(invoice);
                    return (
                      <div className="space-y-1 text-xs">
                        {parsed.amount && (
                          <p>
                            <span className="font-medium">Amount:</span>{" "}
                            {Math.round(parsed.amount / 1000).toLocaleString()} sats
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Expires:</span>{" "}
                          {new Date(parsed.expiry * 1000).toLocaleString()}
                        </p>
                        {parsed.paymentHash && (
                          <p className="break-all">
                            <span className="font-medium">Hash:</span> {parsed.paymentHash}
                          </p>
                        )}
                      </div>
                    );
                  } catch {
                    return <p className="text-xs opacity-50">Could not parse invoice</p>;
                  }
                })()}
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full mt-2 font-mono"
                  value={invoice}
                  readOnly
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Wallet pay option */}
          <div className="w-full">
            <div className="divider text-xs opacity-50">OR PAY WITH WALLET</div>
            {wallet ? (
              <button className="btn btn-warning btn-block" onClick={() => handleWalletPay()}>
                Pay with Connected Wallet
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={() => setStep("connect-wallet")}>
                Connect Wallet
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm opacity-70">
            <span className="loading loading-dots loading-sm"></span>
            Waiting for payment confirmation from relays...
          </div>

          <div className="modal-action w-full">
            <button className="btn btn-ghost btn-block" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step: Connect Wallet */}
      {step === "connect-wallet" && (
        <ConnectWalletStep onConnect={(w) => handleWalletPay(w)} onBack={() => setStep("awaiting-payment")} />
      )}

      {/* Step: Paying with Wallet */}
      {step === "paying-with-wallet" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <span className="loading loading-spinner loading-lg text-warning"></span>
          <p className="text-sm opacity-70">Paying invoice with connected wallet...</p>
        </div>
      )}

      {/* Step: Wallet Pay Error */}
      {step === "wallet-pay-error" && (
        <div className="flex flex-col gap-4 py-4">
          <div className="alert alert-error">
            <span>{error || "Failed to pay with wallet"}</span>
          </div>
          <p className="text-sm opacity-70 text-center">
            The connected wallet failed to pay the invoice. You can try connecting a different wallet or pay manually
            with the invoice QR code.
          </p>
          <div className="flex flex-col gap-2">
            <button className="btn btn-warning btn-block" onClick={() => setStep("connect-wallet")}>
              Connect Different Wallet
            </button>
            <button className="btn btn-outline btn-block" onClick={handleDisconnectWallet}>
              Show Invoice
            </button>
            <button className="btn btn-ghost btn-block" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl">&#9889;</div>
          <h4 className="text-xl font-bold text-success">Zap Sent!</h4>
          <p className="text-sm opacity-70 text-center">
            You successfully zapped <span className="font-bold text-warning">{effectiveAmount.toLocaleString()}</span>{" "}
            sats
            {message && (
              <>
                {" "}
                with the message: <em>"{message}"</em>
              </>
            )}
          </p>
          <div className="modal-action w-full">
            <button className="btn btn-success btn-block" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Step: Error */}
      {step === "error" && (
        <div className="flex flex-col gap-4 py-4">
          <div className="alert alert-error">
            <span>{error || "Something went wrong"}</span>
          </div>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-warning"
              onClick={() => {
                setStep("select-amount");
                setError(null);
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// --- Modal Wrapper ---

function ZapModal({ note }: { note: Note }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Remount ZapForm fresh each time the dialog closes so state resets for next open
    const handleClose = () => setFormKey((k) => k + 1);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <dialog id="zap_modal" ref={dialogRef} className="modal">
      <div className="modal-box max-w-md">
        <ZapForm key={formKey} note={note} onClose={() => dialogRef.current?.close()} />
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

// --- Main Component ---
export default function ZapModalExample() {
  // Load the note event using the full pointer so the event loader knows which relays to check
  const noteEvent = use$(() => eventStore.event(eventPointer), [eventPointer.id]);
  const note = useMemo(() => (noteEvent ? castEvent(noteEvent, Note) : undefined), [noteEvent]);

  // Subscribe to zaps on the event
  use$(() => {
    if (!note) return;

    // Get the users inboxes and merge with default relays
    const relays$ = note.author.inboxes$.pipe(
      startWith(undefined),
      map((inboxes) => relaySet(inboxes, DEFAULT_RELAYS)),
    );
    return pool.subscription(relays$, { kinds: [kinds.Zap], "#e": [note.id] }).pipe(
      // Add all zaps to store for other components to use
      mapEventsToStore(eventStore),
    );
  }, [note?.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
      {note ? (
        <>
          <NoteCard
            note={note}
            onZap={() => (document.getElementById("zap_modal") as HTMLDialogElement)?.showModal()}
          />
          <ZapModal note={note} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-sm opacity-70">Loading note from relays...</p>
          <p className="text-xs opacity-40 font-mono break-all max-w-md">{eventPointer.id}</p>
        </div>
      )}
    </div>
  );
}
