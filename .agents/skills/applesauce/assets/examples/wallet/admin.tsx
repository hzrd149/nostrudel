/**
 * Full-page admin dashboard for the NutWallet class with wallet management and debugging panels
 * @tags nip-60, nip-61, wallet, cashu, admin, debugging
 * @related wallet/wallet
 */
import { getEncodedToken, MintQuoteBolt11Response, normalizeProofAmounts } from "@cashu/cashu-ts";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { parseBolt11, persistEncryptedContent } from "applesauce-common/helpers";
import { defined, EventStore } from "applesauce-core";
import { Filter, persistEventsToCache, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { PrivateKeySigner } from "applesauce-signers";
import { WalletService, WalletServiceHandlers } from "applesauce-wallet-connect";
import { CashuWalletMethods, CommonWalletMethods, Transaction } from "applesauce-wallet-connect/helpers";
import { InsufficientBalanceError, NotFoundError } from "applesauce-wallet-connect/helpers/error";
import { IndexedDBCouch } from "applesauce-wallet/helpers";
import { NutWallet, WalletStatus } from "applesauce-wallet/wallet";
import { addEvents, getEventsForFilters, openDB } from "nostr-idb";
import { generateSecretKey } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, firstValueFrom } from "rxjs";

import LoginView from "../../components/login-view";
import QRCode from "../../components/qr-code";
import UnlockView from "../../components/unlock-view";
import SecureStorage from "../../extra/encrypted-storage";

// Register the wallet casts so user.wallet$ is available
import "applesauce-wallet/casts";

// ---- Application infrastructure (owned by the app, not the wallet) ----
const storage$ = new BehaviorSubject<SecureStorage | null>(null);

const eventStore = new EventStore();
const pool = new RelayPool();
const couch = new IndexedDBCouch();

// Decrypt hidden content using the encrypted storage
persistEncryptedContent(eventStore, storage$.pipe(defined()));

// Local event cache
const cache = await openDB();
const cacheRequest = (filters: Filter[]) => getEventsForFilters(cache, filters);
persistEventsToCache(eventStore, (events) => addEvents(cache, events));

// Bootstrap loader for wallet + mailbox events
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
  cacheRequest,
});

const DEFAULT_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net", "wss://relay.ditto.pub"];
const SUGGESTED_MINTS = ["https://mint.minibits.cash/Bitcoin", "https://mint2.nutmix.cash", "https://21mint.me"];

// ---- Nostr Wallet Connect service (lets external NWC apps use this cashu wallet) ----
// Bind the wallet service transport to the shared relay pool
WalletService.pool = pool;

/** The wallet methods exposed over NWC */
type NwcMethods = CommonWalletMethods | CashuWalletMethods;

/** Persisted connection config so the service survives a page reload */
type ConnectConfig = { key: string; secret: string; relays: string[] };

/** The currently running wallet service (kept at module scope so it survives tab switches) */
const service$ = new BehaviorSubject<WalletService<NwcMethods> | null>(null);

/** In-memory lightning transactions, so list_transactions and lookup_invoice have something to return */
const nwcTransactions$ = new BehaviorSubject<Transaction[]>([]);

/** A simple in-memory request log for the NWC service, so you can see it working */
const requestLog$ = new BehaviorSubject<string[]>([]);

/** Appends a line to the request log (keeping the last 100) */
function logRequest(line: string) {
  const time = new Date().toLocaleTimeString();
  requestLog$.next([...requestLog$.value, `${time}  ${line}`].slice(-100));
}

/** Inserts or replaces a transaction (keyed by payment hash, falling back to the invoice) */
function upsertNwcTransaction(tx: Transaction): Transaction {
  const key = tx.payment_hash || tx.invoice;
  const rest = nwcTransactions$.value.filter((t) => (t.payment_hash || t.invoice) !== key);
  nwcTransactions$.next([tx, ...rest]);
  return tx;
}

const connectStorageKey = (pubkey: string) => `nwc-service:${pubkey}`;

function loadConnectConfig(pubkey: string): ConnectConfig | null {
  try {
    const raw = localStorage.getItem(connectStorageKey(pubkey));
    return raw ? (JSON.parse(raw) as ConnectConfig) : null;
  } catch {
    return null;
  }
}

function saveConnectConfig(pubkey: string, config: ConnectConfig | null) {
  if (config) localStorage.setItem(connectStorageKey(pubkey), JSON.stringify(config));
  else localStorage.removeItem(connectStorageKey(pubkey));
}

/** Maps NWC method calls onto the NutWallet */
function createNwcHandlers(wallet: NutWallet): WalletServiceHandlers<NwcMethods> {
  const handlers: WalletServiceHandlers<NwcMethods> = {
    get_balance: async () => ({ balance: (await firstValueFrom(wallet.totalBalance$)) * 1000 }),
    cashu_list_mints: async () => {
      const balance = (await firstValueFrom(wallet.balance$)) ?? {};
      return { mints: Object.entries(balance).map(([url, amount]) => ({ url, balances: { sat: amount } })) };
    },
    cashu_withdraw: async ({ amount, mints }) => ({ token: await wallet.sendToken(amount, { mint: mints?.[0] }) }),
    cashu_deposit: async ({ token }) => {
      await wallet.receiveToken(token);
      return { success: true as const };
    },

    // ---- bolt11 lightning (mint = receive, melt = send) ----

    // make_invoice mints: create a mint quote, return its invoice, then redeem in the background once paid
    make_invoice: async ({ amount, description, description_hash }) => {
      const mint = (await firstValueFrom(wallet.mintUrls$))?.[0];
      if (!mint) throw new NotFoundError("No mint configured");

      const sats = Math.floor(amount / 1000);
      const quote = await wallet.createMintQuote(mint, sats, description);
      const parsed = parseBolt11(quote.request);
      const tx = upsertNwcTransaction({
        type: "incoming",
        state: "pending",
        amount,
        fees_paid: 0,
        created_at: unixNow(),
        invoice: quote.request,
        description,
        description_hash,
        payment_hash: parsed.paymentHash,
        expires_at: parsed.expiry,
      });

      // Wait for payment, mint the proofs, then mark settled and notify the client
      wallet
        .waitForMintQuote(mint, quote.quote)
        .then(() => wallet.redeemMintQuote(mint, sats, quote))
        .then(() => {
          const settled = upsertNwcTransaction({ ...tx, state: "settled", settled_at: unixNow() });
          service$.value?.notify("payment_received", settled).catch(() => {});
        })
        .catch((error) => console.error("Failed to redeem mint quote:", error));

      return tx;
    },

    // pay_invoice melts: pick a mint with enough balance and pay the invoice with ecash
    pay_invoice: async ({ invoice, amount }) => {
      const parsed = parseBolt11(invoice);
      const msats = amount ?? parsed.amount ?? 0;
      if (!msats) throw new Error("Missing invoice amount");
      const sats = Math.floor(msats / 1000);

      const balance = (await wallet.balance$.$first()) ?? {};
      const mint = Object.entries(balance)
        .sort(([, a], [, b]) => b - a)
        .find(([, value]) => value >= sats)?.[0];
      if (!mint) throw new InsufficientBalanceError("No mint with enough balance to pay this invoice");

      const response = await wallet.payInvoice(mint, invoice);
      const preimage = response.quote.payment_preimage ?? "";
      upsertNwcTransaction({
        type: "outgoing",
        state: "settled",
        amount: msats,
        fees_paid: 0,
        created_at: unixNow(),
        settled_at: unixNow(),
        invoice,
        description: parsed.description,
        payment_hash: parsed.paymentHash,
        preimage,
      });

      return { preimage };
    },

    lookup_invoice: async ({ payment_hash, invoice }) => {
      const tx = nwcTransactions$.value.find(
        (t) => (payment_hash && t.payment_hash === payment_hash) || (invoice && t.invoice === invoice),
      );
      if (!tx) throw new NotFoundError("Invoice not found");
      return tx;
    },

    list_transactions: async () => ({ transactions: nwcTransactions$.value }),
  };

  // Wrap each handler so every request is appended to the request log
  return Object.fromEntries(
    Object.entries(handlers).map(([method, handler]) => [
      method,
      async (...args: unknown[]) => {
        logRequest(`→ ${method}`);
        try {
          const result = await (handler as (...a: unknown[]) => Promise<unknown>)(...args);
          logRequest(`✓ ${method}`);
          return result;
        } catch (error) {
          logRequest(`✗ ${method}: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      },
    ]),
  ) as WalletServiceHandlers<NwcMethods>;
}

/** Starts (or restarts) the NWC service from a config and persists it */
async function startNwcService(wallet: NutWallet, config: ConnectConfig): Promise<void> {
  service$.value?.stop();
  const service = new WalletService<NwcMethods>({
    relays: config.relays,
    signer: PrivateKeySigner.fromKey(config.key),
    secret: hexToBytes(config.secret),
    handlers: createNwcHandlers(wallet),
    notifications: ["payment_received", "payment_sent"],
  });
  await service.start();
  saveConnectConfig(wallet.pubkey, config);
  service$.next(service);
}

/** Starts or restarts the service on a new relay set, keeping the existing connection identity */
function setNwcRelays(wallet: NutWallet, relays: string[]): Promise<void> {
  const existing = loadConnectConfig(wallet.pubkey);
  const config: ConnectConfig = existing
    ? { ...existing, relays }
    : { key: bytesToHex(generateSecretKey()), secret: bytesToHex(generateSecretKey()), relays };
  return startNwcService(wallet, config);
}

/** Stops the NWC service and clears the persisted config */
function stopNwcService(pubkey: string): void {
  service$.value?.stop();
  saveConnectConfig(pubkey, null);
  service$.next(null);
}

/** Restores a persisted NWC service for a wallet, if one was saved */
function restoreNwcService(wallet: NutWallet): void {
  const config = loadConnectConfig(wallet.pubkey);
  if (config) startNwcService(wallet, config).catch((error) => console.error("Failed to restore NWC service:", error));
}

// ---- Small presentational helpers ----
function StatusBadge({ status }: { status: WalletStatus }) {
  const map: Record<WalletStatus, string> = {
    [WalletStatus.Idle]: "badge-ghost",
    [WalletStatus.Loading]: "badge-warning",
    [WalletStatus.Ready]: "badge-success",
    [WalletStatus.Missing]: "badge-error",
  };
  return <span className={`badge badge-lg ${map[status]}`}>{status}</span>;
}

function Indicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`badge badge-lg ${active ? "badge-primary" : "badge-ghost"} gap-2`}>
      {active && <span className="loading loading-spinner loading-xs" />}
      {label}
    </span>
  );
}

function Panel({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-base-300 bg-base-100">
      {(title || action) && (
        <div className="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          <span className="flex-1" />
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-base-300 p-4">
      <div className="text-sm text-base-content/60">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

// ---- Lock controls ----
function LockControls({ wallet }: { wallet: NutWallet }) {
  const unlocked = use$(wallet.unlocked$);
  const [autoUnlock, setAutoUnlock] = useState(wallet.autoUnlock);
  const ops = use$(wallet.operationsState$) ?? {};

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="label cursor-pointer gap-2">
        <span className="label-text">Auto unlock</span>
        <input
          type="checkbox"
          className="toggle"
          checked={autoUnlock}
          onChange={(e) => {
            wallet.setAutoUnlock(e.target.checked);
            setAutoUnlock(e.target.checked);
          }}
        />
      </label>
      {unlocked ? (
        <button className="btn" onClick={() => wallet.lock()} disabled={ops.lock}>
          {ops.lock ? <span className="loading loading-spinner loading-sm" /> : "Lock"}
        </button>
      ) : (
        <button className="btn btn-primary" onClick={() => wallet.unlock()} disabled={ops.unlock}>
          {ops.unlock ? <span className="loading loading-spinner loading-sm" /> : "Unlock"}
        </button>
      )}
    </div>
  );
}

// ---- Header / status bar ----
function Header({ wallet }: { wallet: NutWallet }) {
  const status = use$(wallet.status$) ?? WalletStatus.Idle;
  const loading = use$(wallet.loadingState$);
  const syncing = use$(wallet.syncingState$);
  const busy = use$(wallet.busy$);
  const unlocked = use$(wallet.unlocked$);
  const error = use$(wallet.errorState$);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wallet Admin</h1>
          <div className="font-mono text-sm text-base-content/60 break-all">{wallet.pubkey}</div>
        </div>
        <span className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <Indicator label="Loading" active={!!loading} />
          <Indicator label="Syncing" active={!!syncing} />
          <Indicator label="Busy" active={!!busy} />
          <span className={`badge badge-lg ${unlocked ? "badge-success" : "badge-ghost"}`}>
            {unlocked ? "Unlocked" : "Locked"}
          </span>
          <button className="btn" onClick={() => wallet.resync()}>
            Resync
          </button>
        </div>
      </div>
      {error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}

// ---- Relay status table ----
function RelayTable({ wallet }: { wallet: NutWallet }) {
  const relays = use$(wallet.relayStatus$) ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Relay</th>
            <th>Connected</th>
            <th>Ready</th>
            <th>Auth</th>
            <th>NIP-77</th>
          </tr>
        </thead>
        <tbody>
          {relays.map((relay) => (
            <tr key={relay.url}>
              <td className="font-mono">{relay.url}</td>
              <td>{relay.connected ? "🟢" : "🔴"}</td>
              <td>{relay.ready ? "🟢" : "🔴"}</td>
              <td>{relay.authenticated ? "🟢" : "—"}</td>
              <td>{relay.negentropy === undefined ? "?" : relay.negentropy ? "🟢" : "🔴"}</td>
            </tr>
          ))}
          {relays.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-base-content/60">
                No relays
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- Balance by mint ----
function BalanceTable({ wallet }: { wallet: NutWallet }) {
  const balance = use$(wallet.balance$);
  const entries = balance ? Object.entries(balance) : [];

  if (entries.length === 0) return <div className="text-base-content/60">No balance</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Mint</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([mint, amount]) => (
            <tr key={mint}>
              <td className="font-mono">{mint}</td>
              <td className="text-right font-medium">{amount} sats</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Overview ----
function OverviewSection({ wallet }: { wallet: NutWallet }) {
  const total = use$(wallet.totalBalance$) ?? 0;
  const balance = use$(wallet.balance$);
  const tokenCount = use$(wallet.tokenCount$) ?? 0;
  const historyCount = use$(wallet.historyCount$) ?? 0;
  const relays = use$(wallet.relayStatus$) ?? [];
  const couchTokens = use$(wallet.couchTokens$) ?? [];
  const staleCount = use$(wallet.staleTokenCount$) ?? 0;
  const ops = use$(wallet.operationsState$) ?? {};
  const [deleteOldTokens, setDeleteOldTokens] = useState(wallet.deleteOldTokens);

  const connected = relays.filter((r) => r.connected).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Total balance" value={`${total} sats`} />
        <Stat label="Tokens" value={tokenCount} />
        <Stat label="History" value={historyCount} />
        <Stat label="Mints" value={balance ? Object.keys(balance).length : 0} />
        <Stat label="Relays" value={`${connected}/${relays.length}`} />
        <Stat label="Couch" value={couchTokens.length} />
      </div>

      <Panel title="Lock controls">
        <LockControls wallet={wallet} />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Balance by mint">
          <BalanceTable wallet={wallet} />
        </Panel>
        <Panel title="Relays">
          <RelayTable wallet={wallet} />
        </Panel>
      </div>

      <Panel
        title={`Couch (${couchTokens.length})`}
        action={
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => wallet.refreshCouch()}>
              Refresh
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => wallet.recoverFromCouch()}
              disabled={ops.recover || couchTokens.length === 0}
            >
              {ops.recover ? <span className="loading loading-spinner loading-sm" /> : "Recover"}
            </button>
          </div>
        }
      >
        {couchTokens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mint</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {couchTokens.map((token, i) => (
                  <tr key={i}>
                    <td className="font-mono">{token.mint}</td>
                    <td className="text-right">{token.proofs.reduce((sum, p) => sum + p.amount.toNumber(), 0)} sats</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-base-content/60">Couch is empty</div>
        )}
      </Panel>

      <Panel
        title={`Deleted tokens (${staleCount})`}
        action={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => wallet.cleanupDeletedTokens()}
            disabled={ops.cleanup || staleCount === 0}
          >
            {ops.cleanup ? <span className="loading loading-spinner loading-sm" /> : "Cleanup"}
          </button>
        }
      >
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={deleteOldTokens}
            onChange={(e) => {
              wallet.setDeleteOldTokens(e.target.checked);
              setDeleteOldTokens(e.target.checked);
            }}
          />
          <span className="label-text">Publish delete events for spent tokens</span>
        </label>
        <p className="text-xs text-base-content/60 mt-1 mb-4">
          When off, spent token events are only marked deleted via each new token's <code>del</code> field and removed
          later with cleanup.
        </p>
        {staleCount > 0 ? (
          <div className="text-base-content/60">
            {staleCount} token event{staleCount === 1 ? "" : "s"} {staleCount === 1 ? "is" : "are"} marked deleted by a
            newer token but still on relays. Cleanup publishes a single delete event to remove them.
          </div>
        ) : (
          <div className="text-base-content/60">No token events waiting to be cleaned up</div>
        )}
      </Panel>
    </div>
  );
}

// ---- Send ----
function SendSection({ wallet }: { wallet: NutWallet }) {
  const balance = use$(wallet.balance$);
  const ops = use$(wallet.operationsState$) ?? {};
  const [amount, setAmount] = useState("");
  const [mint, setMint] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const mints = useMemo(() => (balance ? Object.keys(balance).filter((m) => (balance[m] || 0) > 0) : []), [balance]);

  const handleSend = useCallback(async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) return;
    const encoded = await wallet.sendToken(sats, { mint: mint || undefined });
    setToken(encoded);
    setAmount("");
  }, [wallet, amount, mint]);

  return (
    <div className="max-w-2xl">
      <Panel title="Send a Cashu token">
        {token ? (
          <div className="space-y-3">
            <div className="alert alert-success">Token created</div>
            <textarea className="textarea textarea-bordered w-full h-32 font-mono" value={token} readOnly />
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(token)}>
                Copy
              </button>
              <button className="btn" onClick={() => setToken(null)}>
                New
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Amount in sats"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {mints.length > 0 && (
              <select className="select select-bordered w-full" value={mint} onChange={(e) => setMint(e.target.value)}>
                <option value="">Auto-select mint</option>
                {mints.map((m) => (
                  <option key={m} value={m}>
                    {m} ({balance?.[m] || 0} sats)
                  </option>
                ))}
              </select>
            )}
            <button className="btn btn-primary" onClick={handleSend} disabled={ops.send || !amount}>
              {ops.send ? <span className="loading loading-spinner loading-sm" /> : "Create token"}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---- Receive ----
function ReceiveSection({ wallet }: { wallet: NutWallet }) {
  const ops = use$(wallet.operationsState$) ?? {};
  const [token, setToken] = useState("");

  const handleReceive = useCallback(async () => {
    if (!token.trim()) return;
    await wallet.receiveToken(token.trim());
    setToken("");
  }, [wallet, token]);

  return (
    <div className="max-w-2xl">
      <Panel title="Receive a Cashu token">
        <div className="space-y-4">
          <textarea
            className="textarea textarea-bordered w-full h-32 font-mono"
            placeholder="Paste a cashu token (cashuA...)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleReceive} disabled={ops.receive || !token.trim()}>
            {ops.receive ? <span className="loading loading-spinner loading-sm" /> : "Receive"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

// ---- Deposit (mint) ----
function DepositSection({ wallet }: { wallet: NutWallet }) {
  const mints = use$(wallet.mintUrls$) ?? [];
  const ops = use$(wallet.operationsState$) ?? {};
  const [amount, setAmount] = useState("");
  const [mint, setMint] = useState("");
  const [quote, setQuote] = useState<MintQuoteBolt11Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!mint && mints.length > 0) setMint(mints[0]);
  }, [mints, mint]);

  const handleDeposit = useCallback(async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) return;
    const target = mint || mints[0];
    if (!target) return setError("Add a mint first");

    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      // wallet.deposit creates the quote, surfaces the invoice, waits for payment, and redeems the proofs
      await wallet.deposit({ method: "bolt11", mint: target, amount: sats, onQuote: setQuote, signal: ac.signal });
      setQuote(null);
      setAmount("");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to deposit");
      setQuote(null);
    }
  }, [wallet, amount, mint, mints]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setQuote(null);
  }, []);

  return (
    <div className="max-w-2xl">
      <Panel title="Deposit with Lightning">
        {quote ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <QRCode value={quote.request} size={220} className="rounded" alt="Lightning invoice QR code" />
            </div>
            <textarea
              className="textarea textarea-bordered w-full h-24 font-mono text-xs"
              value={quote.request}
              readOnly
            />
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span className="loading loading-spinner loading-sm" />
              {ops.mint ? "Payment received, minting tokens…" : "Waiting for payment…"}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(quote.request)}>
                Copy invoice
              </button>
              <button className="btn" onClick={cancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Amount in sats"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {mints.length > 0 && (
              <select className="select select-bordered w-full" value={mint} onChange={(e) => setMint(e.target.value)}>
                {mints.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            <button className="btn btn-primary" onClick={handleDeposit} disabled={ops.mintQuote || !amount}>
              {ops.mintQuote ? <span className="loading loading-spinner loading-sm" /> : "Create invoice"}
            </button>
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---- Withdraw (melt) ----
function WithdrawSection({ wallet }: { wallet: NutWallet }) {
  const balance = use$(wallet.balance$);
  const ops = use$(wallet.operationsState$) ?? {};
  const [invoice, setInvoice] = useState("");
  const [mint, setMint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mints = useMemo(() => (balance ? Object.keys(balance).filter((m) => (balance[m] || 0) > 0) : []), [balance]);

  useEffect(() => {
    if (!mint && mints.length > 0) setMint(mints[0]);
  }, [mints, mint]);

  const handlePay = useCallback(async () => {
    const target = mint || mints[0];
    if (!target) return setError("No mint with a balance to pay from");
    if (!invoice.trim()) return;

    setError(null);
    setSuccess(null);
    try {
      const response = await wallet.payInvoice(target, invoice.trim());
      const change = response.change.reduce((sum, proof) => sum + proof.amount.toNumber(), 0);
      setSuccess(change > 0 ? `Invoice paid, ${change} sats change returned` : "Invoice paid");
      setInvoice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pay invoice");
    }
  }, [wallet, invoice, mint, mints]);

  return (
    <div className="max-w-2xl">
      <Panel title="Withdraw with Lightning">
        <div className="space-y-4">
          <textarea
            className="textarea textarea-bordered w-full h-24 font-mono text-xs"
            placeholder="Paste a bolt11 invoice (lnbc...)"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />
          {mints.length > 0 && (
            <select className="select select-bordered w-full" value={mint} onChange={(e) => setMint(e.target.value)}>
              {mints.map((m) => (
                <option key={m} value={m}>
                  {m} ({balance?.[m] || 0} sats)
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={handlePay} disabled={ops.melt || !invoice.trim()}>
            {ops.melt ? <span className="loading loading-spinner loading-sm" /> : "Pay invoice"}
          </button>
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </Panel>
    </div>
  );
}

// ---- Tokens ----
function TokensSection({ wallet }: { wallet: NutWallet }) {
  const coverage = use$(wallet.tokenRelayCoverage$);
  const relays = coverage?.relays ?? [];
  const tokens = coverage?.tokens ?? [];
  const total = coverage?.total ?? 0;

  if (total === 0)
    return (
      <Panel title="Tokens (0)">
        <div className="text-base-content/60">No tokens</div>
      </Panel>
    );

  return (
    <Panel title={`Tokens (${total})`}>
      <p className="text-sm text-base-content/60 mb-3">
        Each column is a wallet relay. 🟢 means the relay is storing the token event, 🔴 means it is missing — a column
        full of 🔴 is a relay that is not storing your tokens.
      </p>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Mint</th>
              {relays.map((url) => (
                <th key={url} className="text-center" title={url}>
                  {new URL(url).hostname}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {tokens.map(({ token, stored }) => {
              const storedSet = new Set(stored);
              const encoded =
                token.unlocked && token.mint && token.proofs
                  ? getEncodedToken({ mint: token.mint, proofs: normalizeProofAmounts(token.proofs) })
                  : null;
              return (
                <tr key={token.id}>
                  <td className="font-medium whitespace-nowrap">{token.unlocked ? `${token.amount} sats` : "🔒"}</td>
                  <td className="font-mono">{token.unlocked && token.mint ? new URL(token.mint).hostname : "—"}</td>
                  {relays.map((url) => (
                    <td key={url} className="text-center" title={url}>
                      {storedSet.has(url) ? "🟢" : "🔴"}
                    </td>
                  ))}
                  <td className="text-right">
                    {encoded && (
                      <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(encoded)}>
                        Copy
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {relays.length > 0 && (
            <tfoot>
              <tr>
                <th>Coverage</th>
                <th />
                {relays.map((url) => {
                  const count = coverage?.perRelay[url] ?? 0;
                  const color = count === total ? "text-success" : count === 0 ? "text-error" : "text-warning";
                  return (
                    <th key={url} className={`text-center ${color}`}>
                      {count}/{total}
                    </th>
                  );
                })}
                <th />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Panel>
  );
}

// ---- History ----
function HistorySection({ wallet }: { wallet: NutWallet }) {
  const history = use$(wallet.history$);

  return (
    <Panel title={`History (${history?.length ?? 0})`}>
      {history?.length ? (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Direction</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  {entry.unlocked ? (
                    <>
                      <td className={entry.direction === "in" ? "text-success" : "text-error"}>
                        {entry.direction === "in" ? "Received" : "Sent"}
                      </td>
                      <td className="text-right font-medium">{entry.amount} sats</td>
                    </>
                  ) : (
                    <td colSpan={2} className="text-base-content/60">
                      Locked
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-base-content/60">No history</div>
      )}
    </Panel>
  );
}

// ---- A small editable list of strings ----
function ListEditor({
  items,
  placeholder,
  busy,
  onChange,
}: {
  items: string[];
  placeholder: string;
  busy?: boolean;
  onChange: (items: string[]) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 border border-base-300 p-2">
            <span className="font-mono truncate flex-1">{item}</span>
            <button
              className="btn btn-sm btn-error"
              disabled={busy}
              onClick={() => onChange(items.filter((i) => i !== item))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input input-bordered flex-1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={busy || !value.trim() || items.includes(value.trim())}
          onClick={() => {
            onChange([...items, value.trim()]);
            setValue("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ---- Settings ----
function SettingsSection({ wallet }: { wallet: NutWallet }) {
  const mints = use$(wallet.mintUrls$) ?? [];
  const relays = use$(wallet.walletRelays$) ?? [];
  const ops = use$(wallet.operationsState$) ?? {};

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Mints">
          <ListEditor
            items={mints}
            placeholder="https://mint.example.com"
            busy={ops.setMints}
            onChange={(next) => wallet.setMints(next)}
          />
        </Panel>
        <Panel title="Relays">
          <ListEditor
            items={relays}
            placeholder="wss://relay.example.com"
            busy={ops.setRelays}
            onChange={(next) => wallet.setRelays(next)}
          />
        </Panel>
      </div>
      <Panel title="Maintenance">
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => wallet.consolidateTokens()} disabled={ops.consolidate}>
            {ops.consolidate ? <span className="loading loading-spinner loading-sm" /> : "Consolidate tokens"}
          </button>
          <button className="btn" onClick={() => wallet.rollover()} disabled={ops.rollover}>
            {ops.rollover ? <span className="loading loading-spinner loading-sm" /> : "Rollover tokens"}
          </button>
          <button className="btn" onClick={() => wallet.syncTokens()} disabled={ops.sync}>
            {ops.sync ? <span className="loading loading-spinner loading-sm" /> : "Sync tokens"}
          </button>
        </div>
        <p className="text-xs text-base-content/60 mt-3">
          Rollover swaps every token for fresh proofs at its mint, recording the replaced token ids in each new token's{" "}
          <code>del</code> field.
        </p>
      </Panel>
    </div>
  );
}

// ---- Create view ----
function CreateSection({ wallet }: { wallet: NutWallet }) {
  const ops = use$(wallet.operationsState$) ?? {};
  const [mints, setMints] = useState<string[]>([]);
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [receiveNutzaps, setReceiveNutzaps] = useState(false);

  const handleCreate = useCallback(() => {
    if (mints.length === 0) return;
    wallet.createWallet({
      mints,
      relays,
      privateKey: receiveNutzaps ? generateSecretKey() : undefined,
    });
  }, [wallet, mints, relays, receiveNutzaps]);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="alert alert-warning">
        <span>No wallet found. Create one below.</span>
      </div>

      <Panel title="Mints">
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_MINTS.map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${mints.includes(m) ? "btn-primary" : ""}`}
              onClick={() => setMints((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
            >
              {new URL(m).hostname}
            </button>
          ))}
        </div>
        <ListEditor items={mints} placeholder="https://mint.example.com" onChange={setMints} />
      </Panel>

      <Panel title="Relays">
        <ListEditor items={relays} placeholder="wss://relay.example.com" onChange={setRelays} />
      </Panel>

      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          className="checkbox"
          checked={receiveNutzaps}
          onChange={(e) => setReceiveNutzaps(e.target.checked)}
        />
        <span className="label-text">Generate P2PK key (for receiving nutzaps)</span>
      </label>

      <button className="btn btn-primary btn-wide" onClick={handleCreate} disabled={ops.create || mints.length === 0}>
        {ops.create ? <span className="loading loading-spinner loading-sm" /> : "Create wallet"}
      </button>
    </div>
  );
}

// ---- Connect (Nostr Wallet Connect) ----
function ConnectSection({ wallet }: { wallet: NutWallet }) {
  const service = use$(service$);
  const walletRelays = use$(wallet.walletRelays$);
  const log = use$(requestLog$) ?? [];
  const [busy, setBusy] = useState(false);
  const [relays, setRelays] = useState<string[]>([]);
  const seeded = useRef(false);

  // Seed the relay editor once from the saved config, the wallet relays, or the defaults
  useEffect(() => {
    if (seeded.current) return;
    const saved = loadConnectConfig(wallet.pubkey)?.relays;
    if (saved) {
      setRelays(saved);
      seeded.current = true;
    } else if (walletRelays !== undefined) {
      setRelays(walletRelays.length ? walletRelays : ["wss://relay.getalby.com/v1"]);
      seeded.current = true;
    }
  }, [wallet.pubkey, walletRelays]);

  // Start the service, or restart it on the edited relay set if it is already running
  const apply = useCallback(async () => {
    if (relays.length === 0) return;
    setBusy(true);
    try {
      await setNwcRelays(wallet, relays);
    } finally {
      setBusy(false);
    }
  }, [wallet, relays]);

  const uri = service?.running ? service.getConnectURI() : null;

  return (
    <div className="max-w-2xl space-y-6">
      <Panel
        title="Nostr Wallet Connect"
        action={
          service ? (
            <button className="btn btn-sm btn-error" onClick={() => stopNwcService(wallet.pubkey)}>
              Disconnect
            </button>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={apply} disabled={busy || relays.length === 0}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : "Enable"}
            </button>
          )
        }
      >
        {uri ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <QRCode value={uri} size={200} className="rounded shrink-0" alt="Wallet connect QR code" />
            <div className="flex-1 space-y-3">
              <p className="text-sm text-base-content/60">
                Scan this code or paste the connection string into a Nostr Wallet Connect app to let it send and receive
                lightning payments and cashu tokens with this wallet.
              </p>
              <textarea className="textarea textarea-bordered w-full h-24 font-mono text-xs" value={uri} readOnly />
              <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(uri)}>
                Copy connection string
              </button>
            </div>
          </div>
        ) : (
          <p className="text-base-content/60">
            Enable Nostr Wallet Connect to let external apps use this cashu wallet. The connection is saved in this
            browser and restored automatically when you reload.
          </p>
        )}
      </Panel>

      <Panel
        title="Relays"
        action={
          service ? (
            <button className="btn btn-sm" onClick={apply} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : "Update relays"}
            </button>
          ) : undefined
        }
      >
        <ListEditor items={relays} placeholder="wss://relay.example.com" busy={busy} onChange={setRelays} />
        <p className="mt-3 text-sm text-base-content/60">
          The relays the service listens on. Changing them while connected restarts the service and updates the
          connection string.
        </p>
      </Panel>

      <Panel
        title="Request log"
        action={
          log.length > 0 ? (
            <button className="btn btn-sm" onClick={() => requestLog$.next([])}>
              Clear
            </button>
          ) : undefined
        }
      >
        {log.length > 0 ? (
          <div className="h-64 overflow-y-auto border border-base-300 bg-base-200 p-2 font-mono text-xs">
            {log.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60">
            No requests yet. Connect an app and the requests it makes to this wallet will appear here.
          </p>
        )}
      </Panel>
    </div>
  );
}

const SECTIONS = [
  "Overview",
  "Send",
  "Receive",
  "Deposit",
  "Withdraw",
  "Tokens",
  "History",
  "Connect",
  "Settings",
] as const;
type Section = (typeof SECTIONS)[number];

function WalletDashboard({ wallet }: { wallet: NutWallet }) {
  const status = use$(wallet.status$) ?? WalletStatus.Idle;
  const [section, setSection] = useState<Section>("Overview");

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <Header wallet={wallet} />

      {status === WalletStatus.Loading || status === WalletStatus.Idle ? (
        <div className="flex items-center gap-3 justify-center py-24 text-lg text-base-content/60">
          <span className="loading loading-spinner loading-lg" />
          Loading wallet…
        </div>
      ) : status === WalletStatus.Missing ? (
        <CreateSection wallet={wallet} />
      ) : (
        <>
          <div role="tablist" className="tabs tabs-lift">
            {SECTIONS.map((s) => (
              <button
                key={s}
                role="tab"
                className={`tab ${section === s ? "tab-active" : ""}`}
                onClick={() => setSection(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {section === "Overview" && <OverviewSection wallet={wallet} />}
          {section === "Send" && <SendSection wallet={wallet} />}
          {section === "Receive" && <ReceiveSection wallet={wallet} />}
          {section === "Deposit" && <DepositSection wallet={wallet} />}
          {section === "Withdraw" && <WithdrawSection wallet={wallet} />}
          {section === "Tokens" && <TokensSection wallet={wallet} />}
          {section === "History" && <HistorySection wallet={wallet} />}
          {section === "Connect" && <ConnectSection wallet={wallet} />}
          {section === "Settings" && <SettingsSection wallet={wallet} />}
        </>
      )}
    </div>
  );
}

// ---- Session wiring: build a NutWallet once signed in ----
function WalletSession({ signer, pubkey }: { signer: ISigner; pubkey: string }) {
  const [wallet, setWallet] = useState<NutWallet | null>(null);

  useEffect(() => {
    const instance = new NutWallet({ pubkey, signer, pool, eventStore, couch, autoUnlock: true });
    instance.start();
    setWallet(instance);
    // Restore a persisted NWC service (keeps connections alive across reloads)
    restoreNwcService(instance);
    return () => {
      instance.stop();
      // Stop the running service but keep its persisted config for the next load
      service$.value?.stop();
      service$.next(null);
    };
  }, [signer, pubkey]);

  if (!wallet)
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );

  return <WalletDashboard wallet={wallet} />;
}

export default function WalletAdminExample() {
  const storage = use$(storage$);
  const [session, setSession] = useState<{ signer: ISigner; pubkey: string } | null>(null);

  if (!storage) return <UnlockView onUnlock={(s) => storage$.next(s)} />;
  if (!session) return <LoginView onLogin={(signer, pubkey) => setSession({ signer, pubkey })} />;

  return <WalletSession signer={session.signer} pubkey={session.pubkey} />;
}
