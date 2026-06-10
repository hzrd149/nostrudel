/**
 * Minimal lightning wallet that switches between WebLN, NWC, and a NIP-60 Cashu backend
 * @tags wallet, lightning, nwc, webln, nip-60, cashu
 * @related wallet/wallet, wallet/admin
 */
import { parseBolt11, parseLNURLOrAddress } from "applesauce-common/helpers";
import { EventStore } from "applesauce-core";
import { relaySet } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { WalletConnect } from "applesauce-wallet-connect";
import { IndexedDBCouch, WALLET_KIND } from "applesauce-wallet/helpers";
import { NutWallet } from "applesauce-wallet/wallet";
import { generateSecretKey } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, filter, firstValueFrom, map, Observable, of, take, timeout } from "rxjs";

import LoginView from "../../components/login-view";
import QRCode from "../../components/qr-code";
import RelayPicker from "../../components/relay-picker";

// ---- Shared app infrastructure (owned by the app, reused by every backend) ----
const eventStore = new EventStore();
const pool = new RelayPool();
// IndexedDB couch is the NutWallet's proof safety net; wallet events themselves load in memory from relays
const couch = new IndexedDBCouch();

// In-memory bootstrap loader for the NutWallet's wallet/mailbox events (no local cache)
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

// Route the Nostr Wallet Connect transport through the shared relay pool
WalletConnect.pool = pool;

const LOOKUP_RELAYS = ["wss://purplepag.es", "wss://index.hzrd149.com"];
const DEFAULT_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const SUGGESTED_MINTS = ["https://mint.minibits.cash/Bitcoin", "https://21mint.me"];

// A broad relay set used to hunt for an existing NIP-60 wallet event before offering to create one
const DISCOVERY_RELAYS = relaySet(DEFAULT_RELAYS, ["wss://relay.ditto.pub"], LOOKUP_RELAYS);
// How long to search for an existing wallet before concluding the user has none
const WALLET_DISCOVERY_MS = 12_000;

// ---- The unified backend abstraction every wallet type implements ----
type BackendType = "webln" | "nwc" | "nutwallet";

type StoredBackend =
  | { id: string; type: "webln"; label: string }
  | { id: string; type: "nwc"; label: string; uri: string }
  | { id: string; type: "nutwallet"; label: string; pubkey: string };

/** The result of creating an invoice: the bolt11 string plus a promise that resolves once it is paid */
type ReceiveResult = { invoice: string; paid: Promise<void> };

interface WalletBackend {
  id: string;
  type: BackendType;
  label: string;
  /** Balance in sats, or undefined while unknown/loading */
  balance$: Observable<number | undefined>;
  /** Re-poll the balance */
  refresh(): Promise<void>;
  /**
   * Create a bolt11 invoice to add sats to this wallet. Returns the invoice plus a `paid` promise that
   * resolves when that specific invoice is paid (and rejects if `options.signal` aborts).
   */
  makeInvoice(sats: number, options?: { description?: string; signal?: AbortSignal }): Promise<ReceiveResult>;
  /** Pay a bolt11 invoice from this wallet */
  payInvoice(invoice: string): Promise<void>;
  /** Serialize back to the persisted config */
  serialize(): StoredBackend;
  dispose(): void;
}

const abortError = () => new DOMException("Aborted", "AbortError");

/**
 * WebLN has no standard "invoice paid" event, so this is the one backend that detects payment by watching
 * its balance rise (polling `refresh` to keep balance$ fresh).
 */
function awaitBalanceIncrease(
  balance$: Observable<number | undefined>,
  refresh: () => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    let baseline: number | undefined;
    const cleanup = () => {
      sub.unsubscribe();
      clearInterval(interval);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    const sub = balance$.subscribe((balance) => {
      if (balance === undefined) return;
      if (baseline === undefined) baseline = balance;
      else if (balance > baseline) {
        cleanup();
        resolve();
      }
    });
    const interval = setInterval(() => refresh().catch(() => {}), 3000);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// ---- WebLN (window.webln) ----
interface WebLNProvider {
  enable(): Promise<void>;
  getBalance?(): Promise<{ balance: number }>;
  makeInvoice(args: { amount: number | string; defaultMemo?: string }): Promise<{ paymentRequest: string }>;
  sendPayment(invoice: string): Promise<{ preimage: string }>;
}

function getWebln(): WebLNProvider {
  const webln = (window as { webln?: WebLNProvider }).webln;
  if (!webln) throw new Error("No WebLN provider found — install Alby or a compatible extension");
  return webln;
}

async function createWeblnBackend(stored: Extract<StoredBackend, { type: "webln" }>): Promise<WalletBackend> {
  const webln = getWebln();
  await webln.enable();

  const balance$ = new BehaviorSubject<number | undefined>(undefined);
  const refresh = async () => {
    try {
      if (webln.getBalance) balance$.next((await webln.getBalance()).balance);
    } catch (error) {
      console.error("WebLN getBalance failed:", error);
    }
  };
  refresh();

  return {
    id: stored.id,
    type: "webln",
    label: stored.label,
    balance$,
    refresh,
    makeInvoice: async (sats, options) => {
      const { paymentRequest } = await webln.makeInvoice({ amount: sats, defaultMemo: options?.description });
      // No standard WebLN paid event, so fall back to watching the balance rise
      return { invoice: paymentRequest, paid: awaitBalanceIncrease(balance$, refresh, options?.signal) };
    },
    payInvoice: async (invoice) => {
      await webln.sendPayment(invoice);
      await refresh();
    },
    serialize: () => stored,
    dispose: () => {},
  };
}

// ---- Nostr Wallet Connect (NIP-47) ----
function createNwcBackend(stored: Extract<StoredBackend, { type: "nwc" }>): WalletBackend {
  const client = WalletConnect.fromConnectURI(stored.uri);

  const balance$ = new BehaviorSubject<number | undefined>(undefined);
  const refresh = async () => {
    try {
      const { balance } = await client.getBalance();
      balance$.next(Math.floor(balance / 1000)); // msats -> sats
    } catch (error) {
      console.error("NWC getBalance failed:", error);
    }
  };
  refresh();

  return {
    id: stored.id,
    type: "nwc",
    label: stored.label,
    balance$,
    refresh,
    makeInvoice: async (sats, options) => {
      const tx = await client.makeInvoice(sats * 1000, { description: options?.description }); // amount is msats
      if (!tx.invoice) throw new Error("Wallet did not return an invoice");
      // waitForPaid resolves on a payment_received notification for this invoice (rejects when it expires)
      const paid = client.waitForPaid(tx).then(() => refresh());
      return { invoice: tx.invoice, paid };
    },
    payInvoice: async (invoice) => {
      await client.payInvoice(invoice);
      await refresh();
    },
    serialize: () => stored,
    dispose: () => {},
  };
}

// ---- NIP-60 Cashu wallet (applesauce-wallet NutWallet) ----
/**
 * Does its best to find an existing NIP-60 wallet event for a pubkey before we ever offer to create one.
 * Subscribes to a broad relay set for the wallet event (in addition to the NutWallet's own outbox-driven
 * loader) and waits a real discovery window — so a slow load never causes us to create a duplicate wallet.
 */
async function walletExists(pubkey: string): Promise<boolean> {
  const sub = pool
    .subscription(DISCOVERY_RELAYS, { kinds: [WALLET_KIND], authors: [pubkey] }, { eventStore })
    .subscribe({ error: () => {} });
  try {
    return await firstValueFrom(
      eventStore.replaceable(WALLET_KIND, pubkey).pipe(
        filter((event): event is NonNullable<typeof event> => !!event),
        take(1),
        map(() => true),
        timeout({ first: WALLET_DISCOVERY_MS, with: () => of(false) }),
      ),
    );
  } finally {
    sub.unsubscribe();
  }
}

async function createNutWalletBackend(
  stored: Extract<StoredBackend, { type: "nutwallet" }>,
  signer: ISigner,
  options?: { createIfMissing?: boolean },
): Promise<WalletBackend> {
  const wallet = new NutWallet({ pubkey: stored.pubkey, signer, pool, eventStore, couch, autoUnlock: true });
  await wallet.start();

  // When adding a new wallet, search hard for an existing one and only create a wallet if none is found.
  // Restored backends skip this — they already loaded once and just resume in the background.
  if (options?.createIfMissing && !(await walletExists(stored.pubkey)))
    await wallet.createWallet({ mints: SUGGESTED_MINTS, relays: DEFAULT_RELAYS });

  return {
    id: stored.id,
    type: "nutwallet",
    label: stored.label,
    balance$: wallet.totalBalance$,
    refresh: () => wallet.refreshCouch(),
    // Adding sats mints ecash: create a mint quote (lightning invoice), then wait for it to be paid and redeem
    makeInvoice: async (sats, options) => {
      const mints = await firstValueFrom(
        wallet.mintUrls$.pipe(
          filter((m): m is string[] => !!m && m.length > 0),
          take(1),
          timeout({ first: 10_000 }),
        ),
      );
      const mint = mints[0];
      const quote = await wallet.createMintQuote(mint, sats, options?.description);
      // waitForMintQuote resolves natively when the invoice is paid (NIP-17 websocket or polling)
      const paid = wallet
        .waitForMintQuote(mint, quote.quote, { signal: options?.signal })
        .then(() => wallet.redeemMintQuote(mint, sats, quote));
      return { invoice: quote.request, paid };
    },
    // Sending melts ecash: pick a mint with enough balance and pay the invoice
    payInvoice: async (invoice) => {
      const balance = await firstValueFrom(
        wallet.balance$.pipe(
          filter((b): b is Record<string, number> => !!b),
          take(1),
          timeout({ first: 10_000 }),
        ),
      );
      const sats = parseBolt11(invoice).amount ? Math.ceil(parseBolt11(invoice).amount! / 1000) : 0;
      const mint =
        Object.entries(balance)
          .sort(([, a], [, b]) => b - a)
          .find(([, value]) => value >= sats)?.[0] ?? Object.keys(balance)[0];
      if (!mint) throw new Error("No mint with a balance to pay from");
      await wallet.payInvoice(mint, invoice);
    },
    serialize: () => stored,
    dispose: () => wallet.stop(),
  };
}

// ---- Backend registry (persisted to a single localStorage key) ----
const STORAGE_KEY = "multiple-wallets";

const backends$ = new BehaviorSubject<WalletBackend[]>([]);
const activeId$ = new BehaviorSubject<string | undefined>(undefined);

function loadStored(): { backends: StoredBackend[]; activeId?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { backends: [] };
  } catch {
    return { backends: [] };
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ backends: backends$.value.map((b) => b.serialize()), activeId: activeId$.value }),
  );
}

function addBackend(backend: WalletBackend) {
  backends$.next([...backends$.value, backend]);
  if (!activeId$.value) activeId$.next(backend.id);
  persist();
}

function removeBackend(id: string) {
  backends$.value.find((b) => b.id === id)?.dispose();
  const next = backends$.value.filter((b) => b.id !== id);
  backends$.next(next);
  if (activeId$.value === id) activeId$.next(next[0]?.id);
  persist();
}

function setActive(id: string) {
  activeId$.next(id);
  persist();
}

async function reconstruct(stored: StoredBackend, signer: ISigner): Promise<WalletBackend> {
  switch (stored.type) {
    case "webln":
      return createWeblnBackend(stored);
    case "nwc":
      return createNwcBackend(stored);
    case "nutwallet":
      return createNutWalletBackend(stored, signer);
  }
}

let loaded = false;
async function loadBackends(signer: ISigner, pubkey: string) {
  if (loaded) return;
  loaded = true;

  const stored = loadStored();
  const instances: WalletBackend[] = [];
  for (const config of stored.backends) {
    // A NutWallet is tied to its pubkey, so only restore ones the current signer can drive
    if (config.type === "nutwallet" && config.pubkey !== pubkey) continue;
    try {
      instances.push(await reconstruct(config, signer));
    } catch (error) {
      console.error("Failed to restore wallet backend:", config, error);
    }
  }

  backends$.next(instances);
  const active =
    stored.activeId && instances.some((b) => b.id === stored.activeId) ? stored.activeId : instances[0]?.id;
  activeId$.next(active);
}

// ---- Send helper: resolve a bolt11 invoice or a lightning address into an invoice ----
async function resolveInvoice(input: string, sats?: number): Promise<string> {
  const value = input.trim();
  if (/^ln(bc|tb|bcrt)/i.test(value)) return value; // already a bolt11 invoice

  const url = parseLNURLOrAddress(value);
  if (!url) throw new Error("Not a valid invoice or lightning address");
  if (!sats || sats <= 0) throw new Error("Enter an amount to send to a lightning address");

  const meta = await fetch(url).then((res) => res.json());
  const callback = new URL(meta.callback);
  callback.searchParams.set("amount", String(sats * 1000)); // msats
  const { pr } = await fetch(callback).then((res) => res.json());
  if (!pr) throw new Error("Lightning address did not return an invoice");
  return pr;
}

const TYPE_LABELS: Record<BackendType, string> = {
  webln: "WebLN",
  nwc: "Nostr Wallet Connect",
  nutwallet: "Cashu (NIP-60)",
};

// ---- UI ----
function BackendSwitcher({
  backends,
  activeId,
  onAdd,
}: {
  backends: WalletBackend[];
  activeId?: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      <select
        className="select select-bordered flex-1"
        value={activeId ?? ""}
        onChange={(e) => setActive(e.target.value)}
        disabled={backends.length === 0}
      >
        {backends.length === 0 && <option value="">No wallets</option>}
        {backends.map((backend) => (
          <option key={backend.id} value={backend.id}>
            {backend.label} · {TYPE_LABELS[backend.type]}
          </option>
        ))}
      </select>
      {activeId && (
        <button className="btn btn-outline" title="Remove wallet" onClick={() => removeBackend(activeId)}>
          Remove
        </button>
      )}
      <button className="btn btn-primary" onClick={onAdd}>
        + Add
      </button>
    </div>
  );
}

function BalanceView({ backend }: { backend: WalletBackend }) {
  const balance = use$(backend.balance$);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await backend.refresh().finally(() => setRefreshing(false));
  }, [backend]);

  return (
    <div className="border border-base-300 p-6 text-center mb-4">
      <div className="text-sm text-base-content/70 mb-1">{TYPE_LABELS[backend.type]}</div>
      <div className="text-4xl font-bold">
        {balance === undefined ? "—" : balance.toLocaleString()}{" "}
        <span className="text-lg font-normal text-base-content/70">sats</span>
      </div>
      <button className="btn btn-ghost btn-sm mt-2" onClick={refresh} disabled={refreshing}>
        {refreshing ? <span className="loading loading-spinner loading-xs" /> : "Refresh"}
      </button>
    </div>
  );
}

function ReceivePanel({ backend }: { backend: WalletBackend }) {
  const [amount, setAmount] = useState("");
  const [invoice, setInvoice] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleCreate = useCallback(async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) return setError("Enter a valid amount");
    setLoading(true);
    setError(null);
    setPaid(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { invoice, paid } = await backend.makeInvoice(sats, {
        description: "Multiple wallets example",
        signal: controller.signal,
      });
      setInvoice(invoice);
      // The backend's promise resolves when this specific invoice is paid; ignore it if superseded/closed
      paid.then(
        () => {
          if (!controller.signal.aborted) setPaid(true);
        },
        () => {}, // ignore aborts / wait failures
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }, [amount, backend]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setInvoice(null);
    setAmount("");
    setPaid(false);
  }, []);

  // Stop waiting for payment if the panel unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  const copy = useCallback(() => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [invoice]);

  // Once paid, hide the invoice and show a confirmation
  if (invoice && paid)
    return (
      <div className="space-y-4">
        <div className="alert alert-success">Invoice paid!</div>
        <button className="btn btn-primary w-full" onClick={reset}>
          New invoice
        </button>
      </div>
    );

  if (invoice)
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <QRCode value={invoice} size={220} alt="Lightning invoice QR code" />
        </div>
        <textarea className="textarea textarea-bordered w-full h-24 font-mono text-xs" value={invoice} readOnly />
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <span className="loading loading-spinner loading-xs" /> Waiting for payment…
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1" onClick={copy}>
            {copied ? "Copied!" : "Copy invoice"}
          </button>
          <button className="btn" onClick={reset}>
            New
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <input
        type="number"
        className="input input-bordered w-full"
        placeholder="Amount in sats"
        value={amount}
        min="1"
        onChange={(e) => {
          setAmount(e.target.value);
          setError(null);
        }}
      />
      <button className="btn btn-primary w-full" onClick={handleCreate} disabled={loading || !amount.trim()}>
        {loading ? <span className="loading loading-spinner loading-sm" /> : "Create invoice"}
      </button>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}

function SendPanel({ backend }: { backend: WalletBackend }) {
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trimmed = input.trim();
  const isAddress = trimmed.length > 0 && !/^ln(bc|tb|bcrt)/i.test(trimmed);

  const handleSend = useCallback(async () => {
    if (!trimmed) return setError("Paste an invoice or lightning address");
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sats = amount ? parseInt(amount, 10) : undefined;
      const invoice = await resolveInvoice(trimmed, sats);
      await backend.payInvoice(invoice);
      setSuccess("Payment sent");
      setInput("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send payment");
    } finally {
      setLoading(false);
    }
  }, [trimmed, amount, backend]);

  return (
    <div className="space-y-4">
      <textarea
        className="textarea textarea-bordered w-full h-24 font-mono text-xs"
        placeholder="Lightning invoice (lnbc...) or address (name@domain.com)"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
          setSuccess(null);
        }}
      />
      {isAddress && (
        <input
          type="number"
          className="input input-bordered w-full"
          placeholder="Amount in sats"
          value={amount}
          min="1"
          onChange={(e) => setAmount(e.target.value)}
        />
      )}
      <button className="btn btn-primary w-full" onClick={handleSend} disabled={loading || !trimmed}>
        {loading ? <span className="loading loading-spinner loading-sm" /> : "Send payment"}
      </button>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}

function WalletPanels({ backend }: { backend: WalletBackend }) {
  const [tab, setTab] = useState<"receive" | "send">("receive");

  return (
    <div>
      <BalanceView backend={backend} />
      <div className="flex gap-2 mb-4">
        <button
          className={`btn flex-1 ${tab === "receive" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setTab("receive")}
        >
          Receive
        </button>
        <button
          className={`btn flex-1 ${tab === "send" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setTab("send")}
        >
          Send
        </button>
      </div>
      <div className="border border-base-300 p-6">
        {tab === "receive" ? <ReceivePanel backend={backend} /> : <SendPanel backend={backend} />}
      </div>
    </div>
  );
}

/**
 * NWC "wallet auth" connect flow (NIP-47): show a QR the user scans with their wallet. When the wallet
 * connects back over nostr, we hand the parent a full nostr+walletconnect:// string to persist.
 */
function NwcQrConnect({ onConnect }: { onConnect: (uri: string) => void }) {
  const [relay, setRelay] = useState("wss://relay.getalby.com/v1");
  const client = useMemo(() => new WalletConnect({ pool, relays: [relay], secret: generateSecretKey() }), [relay]);

  useEffect(() => {
    let connected = false;
    const controller = new AbortController();
    client
      .waitForService(controller.signal)
      .then(() => {
        connected = true;
        if (client.connectURI) onConnect(client.connectURI);
      })
      .catch(() => {});
    return () => {
      if (!connected) controller.abort();
    };
    // Only re-run when the client (relay) changes, matching nwc/simple-wallet's ConnectAuthUri
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const uri = useMemo(
    () =>
      client.getAuthURI({ methods: ["get_balance", "get_info", "make_invoice", "pay_invoice"], name: "applesauce" }),
    [client],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <a href={uri} className="bg-white p-4">
        <QRCode value={uri} size={192} className="h-48 w-48" alt="Wallet auth QR code" />
      </a>
      <RelayPicker value={relay} onChange={setRelay} common={["wss://relay.getalby.com/v1"]} className="w-full" />
      <a href={uri} className="btn btn-primary btn-block">
        Open in wallet
      </a>
      <p className="text-xs text-base-content/60 text-center">
        Scan with a NWC wallet (e.g. Alby) — it connects back automatically.
      </p>
    </div>
  );
}

function AddWalletModal({ signer, pubkey, onClose }: { signer: ISigner; pubkey: string; onClose: () => void }) {
  const [type, setType] = useState<BackendType>("nwc");
  const [nwcMode, setNwcMode] = useState<"qr" | "paste">("qr");
  const [label, setLabel] = useState("");
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run a backend factory, add the result, and close on success
  const finish = useCallback(
    async (create: () => Promise<WalletBackend> | WalletBackend) => {
      setLoading(true);
      setError(null);
      try {
        addBackend(await create());
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add wallet");
      } finally {
        setLoading(false);
      }
    },
    [onClose],
  );

  // Called by the QR flow once the wallet connects back with a connection string
  const connectNwcUri = useCallback(
    (connectUri: string) =>
      finish(() =>
        createNwcBackend({
          id: crypto.randomUUID(),
          type: "nwc",
          label: label.trim() || TYPE_LABELS.nwc,
          uri: connectUri,
        }),
      ),
    [finish, label],
  );

  const handleAdd = useCallback(() => {
    const id = crypto.randomUUID();
    if (type === "webln")
      return finish(() => createWeblnBackend({ id, type, label: label.trim() || TYPE_LABELS.webln }));
    if (type === "nwc") {
      if (!uri.trim()) return setError("Paste a NWC connection string");
      return finish(() => createNwcBackend({ id, type, label: label.trim() || TYPE_LABELS.nwc, uri: uri.trim() }));
    }
    return finish(() =>
      createNutWalletBackend({ id, type, label: label.trim() || TYPE_LABELS.nutwallet, pubkey }, signer, {
        createIfMissing: true,
      }),
    );
  }, [type, uri, label, pubkey, signer, finish]);

  // The QR flow connects on its own, so it doesn't use the bottom "Add" button
  const showAddButton = !(type === "nwc" && nwcMode === "qr");

  return (
    <dialog className="modal modal-open">
      <div className="modal-box border border-base-300 shadow-none">
        <h3 className="text-lg font-bold mb-4">Add a wallet</h3>

        <div className="flex gap-2 mb-4">
          {(Object.keys(TYPE_LABELS) as BackendType[]).map((t) => (
            <button
              key={t}
              className={`btn btn-sm flex-1 ${type === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setType(t)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={`Label (default: ${TYPE_LABELS[type]})`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          {type === "nwc" && (
            <>
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm flex-1 ${nwcMode === "qr" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setNwcMode("qr")}
                >
                  Scan QR
                </button>
                <button
                  className={`btn btn-sm flex-1 ${nwcMode === "paste" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setNwcMode("paste")}
                >
                  Paste string
                </button>
              </div>
              {nwcMode === "qr" ? (
                <NwcQrConnect onConnect={connectNwcUri} />
              ) : (
                <textarea
                  className="textarea textarea-bordered w-full h-24 font-mono text-xs"
                  placeholder="nostr+walletconnect://..."
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                />
              )}
            </>
          )}
          {type === "webln" && (
            <p className="text-sm text-base-content/70">Connects to your browser's WebLN provider (e.g. Alby).</p>
          )}
          {type === "nutwallet" && (
            <p className="text-sm text-base-content/70">
              Uses your logged-in account's NIP-60 wallet. We search relays for an existing wallet first and only create
              a new one (with suggested mints) if none is found.
            </p>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-sm" /> Connecting…
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {showAddButton && (
            <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Add"}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

function WalletApp({ signer, pubkey }: { signer: ISigner; pubkey: string }) {
  const backends = use$(backends$) ?? [];
  const activeId = use$(activeId$);
  const [adding, setAdding] = useState(false);

  const active = backends.find((b) => b.id === activeId);

  return (
    <div className="container mx-auto my-8 px-4 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Multiple Wallets</h1>

      <BackendSwitcher backends={backends} activeId={activeId} onAdd={() => setAdding(true)} />

      {active ? (
        <WalletPanels backend={active} />
      ) : (
        <div className="border border-base-300 p-8 text-center text-base-content/70">
          No wallets yet — add one to get started.
        </div>
      )}

      {adding && <AddWalletModal signer={signer} pubkey={pubkey} onClose={() => setAdding(false)} />}
    </div>
  );
}

export default function MultipleWalletsExample() {
  const [session, setSession] = useState<{ signer: ISigner; pubkey: string } | null>(null);

  const handleLogin = useCallback(async (signer: ISigner, pubkey: string) => {
    setSession({ signer, pubkey });
    await loadBackends(signer, pubkey);
  }, []);

  // Log in first — the NutWallet backend needs a nostr signer (WebLN and NWC don't use it)
  if (!session) return <LoginView onLogin={handleLogin} />;

  return <WalletApp signer={session.signer} pubkey={session.pubkey} />;
}
