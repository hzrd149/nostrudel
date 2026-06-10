/**
 * Parse and display wallet connection strings with support detection
 * @tags nip-47, nwc, wallet, connection
 * @related nwc/auth-uri, nwc/simple-wallet
 */
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { WalletConnect } from "applesauce-wallet-connect";
import {
  parseWalletConnectURI,
  supportsMethod,
  supportsEncryption,
  supportsNotifications,
  getPreferredEncryption,
  getSupportedMethods,
  getSupportedNotifications,
  WalletSupport,
  NotificationType,
  WalletConnectURI,
  WalletConnectEncryptionMethod,
} from "applesauce-wallet-connect/helpers";
import { hexToBytes } from "@noble/hashes/utils";
import { useMemo, useState } from "react";

// Create a relay pool to make relay connections
const pool = new RelayPool();

// Method descriptions for better UX
const METHOD_DESCRIPTIONS: Record<string, string> = {
  pay_invoice: "Pay Lightning invoices",
  multi_pay_invoice: "Pay multiple Lightning invoices at once",
  pay_keysend: "Send keysend payments",
  multi_pay_keysend: "Send multiple keysend payments at once",
  make_invoice: "Create Lightning invoices",
  lookup_invoice: "Look up invoice status",
  list_transactions: "List transaction history",
  get_balance: "Get wallet balance",
  get_info: "Get wallet information",
};

const ENCRYPTION_DESCRIPTIONS: Record<WalletConnectEncryptionMethod, string> = {
  nip04: "Legacy NIP-04 encryption (less secure)",
  nip44_v2: "Modern NIP-44 v2 encryption (recommended)",
};

const NOTIFICATION_DESCRIPTIONS: Record<NotificationType, string> = {
  payment_received: "Notify when payments are received",
  payment_sent: "Notify when payments are sent",
};

function ParsedUriDisplay({ parsedUri }: { parsedUri?: WalletConnectURI | null }) {
  if (!parsedUri) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Parsed connection string</h2>
      <div className="card card-border bg-base-200">
        <div className="card-body">
          <div>
            <span className="font-medium">Service (Pubkey):</span>
            <code className="px-2 py-1 rounded text-sm font-mono">{parsedUri.service}</code>
          </div>
          <div>
            <span className="font-medium">Relays:</span>
            <div className="mt-1 space-y-1">
              {parsedUri.relays.map((relay: string, index: number) => (
                <div key={index} className="ml-2">
                  <code className="px-2 py-1 rounded text-sm font-mono">{relay}</code>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="font-medium">Secret:</span>
            <code className="px-2 py-1 rounded text-sm font-mono">{parsedUri.secret}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodsSeciton({ walletInfo }: { walletInfo: WalletSupport }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Supported Methods</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(METHOD_DESCRIPTIONS).map(([method, description]) => {
          const isSupported = supportsMethod(walletInfo, method);
          return (
            <div key={method} className="card card-compact card-border bg-base-200">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono">{method}</code>
                  <span className={`badge ${isSupported ? "badge-success" : "badge-neutral"}`}>
                    {isSupported ? "Supported" : "Not Supported"}
                  </span>
                </div>
                <p className="text-sm opacity-70">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EncryptionSection({ walletInfo }: { walletInfo: WalletSupport }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Encryption Support</h2>
      <div className="mb-2">
        <span className="text-sm font-medium">Preferred Method: </span>
        <code className="px-2 py-1 rounded text-sm font-mono badge badge-primary">
          {getPreferredEncryption(walletInfo)}
        </code>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(ENCRYPTION_DESCRIPTIONS).map(([method, description]) => {
          const isSupported = supportsEncryption(walletInfo, method as WalletConnectEncryptionMethod);
          const isPreferred = getPreferredEncryption(walletInfo) === method;
          return (
            <div key={method} className="card card-compact card-border bg-base-200">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono">{method}</code>
                  <div className="flex gap-2">
                    {isPreferred && <span className="badge badge-primary">Preferred</span>}
                    <span className={`badge ${isSupported ? "badge-success" : "badge-neutral"}`}>
                      {isSupported ? "Supported" : "Not Supported"}
                    </span>
                  </div>
                </div>
                <p className="text-sm opacity-70">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsSection({ walletInfo }: { walletInfo: WalletSupport }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Notification Support</h2>
      {supportsNotifications(walletInfo) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(NOTIFICATION_DESCRIPTIONS).map(([notification, description]) => {
            const isSupported = walletInfo.notifications?.includes(notification as any) ?? false;
            return (
              <div key={notification} className="card card-compact card-border bg-base-200">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{notification}</code>
                    <span className={`badge ${isSupported ? "badge-success" : "badge-neutral"}`}>
                      {isSupported ? "Supported" : "Not Supported"}
                    </span>
                  </div>
                  <p className="text-sm opacity-70">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert ">
          <p>This wallet does not support notifications.</p>
        </div>
      )}
    </div>
  );
}

function WalletSummary({ walletInfo }: { walletInfo: WalletSupport }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Wallet Summary</h2>

      <div className="card card-border bg-base-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat">
            <div className="stat-value text-primary">{getSupportedMethods(walletInfo).length}</div>
            <div className="stat-desc">Payment Methods</div>
          </div>
          <div className="stat">
            <div className="stat-value text-secondary">{walletInfo.encryption.length}</div>
            <div className="stat-desc">Encryption Methods</div>
          </div>
          <div className="stat">
            <div className="stat-value text-accent">{getSupportedNotifications(walletInfo).length}</div>
            <div className="stat-desc">Notification Types</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RawWalletInfo({ walletInfo }: { walletInfo: WalletSupport }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Raw Wallet Support</h2>

      <div className="card card-border bg-base-200">
        <div className="card-body">
          <code className="text-sm font-mono whitespace-pre">{JSON.stringify(walletInfo, null, 2)}</code>
        </div>
      </div>
    </div>
  );
}

export default function WalletConnectExample() {
  const [uri, setUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parseWalletConnectURI> | null>(null);

  // Handle URI input and parsing
  const handleUriChange = (value: string) => {
    setUri(value);
    setError(null);
    setParsed(null);

    if (!value.trim()) return;

    try {
      const parsed = parseWalletConnectURI(value);
      setParsed(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse URI");
    }
  };

  // Create WalletConnect instance and get wallet info using the public getter
  const wallet = useMemo(() => {
    if (!parsed) return undefined;

    try {
      const secret = hexToBytes(parsed.secret);
      const walletConnect = new WalletConnect({
        ...parsed,
        secret,
        subscriptionMethod: pool.subscription.bind(pool),
        publishMethod: pool.publish.bind(pool),
      });

      // Use the public getter method to access wallet info observable
      return walletConnect;
    } catch (err) {
      console.error("Failed to create wallet connection:", err);
      return undefined;
    }
  }, [parsed]);

  // Create WalletConnect instance and get wallet info using the public getter
  const support = use$(() => wallet?.support$, [wallet]);

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Nostr Wallet Connect</h1>
        <p className="mb-4 opacity-70">Enter a nostr+walletconnect URI to parse it and fetch wallet information.</p>

        {/* URI Input */}
        <div className="mb-8">
          <label className="label">
            <span className="label-text">Wallet Connect URI</span>
          </label>
          <textarea
            value={uri}
            onChange={(e) => handleUriChange(e.target.value)}
            placeholder="nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=secretkey"
            className="textarea textarea-bordered w-full"
            rows={3}
          />
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>

        <div className="space-y-4">
          {/* Parsed URI Display */}
          <ParsedUriDisplay parsedUri={parsed} />

          {/* Wallet Info Display */}
          {parsed && (
            <>
              {support === undefined ? (
                <div className="alert alert-info">
                  <div className="flex items-center">
                    <span className="loading loading-spinner loading-sm mr-3"></span>
                    <p>Loading wallet information...</p>
                  </div>
                </div>
              ) : support === null ? (
                <div className="alert alert-warning">
                  <p>No wallet information found or wallet is offline.</p>
                </div>
              ) : (
                <>
                  <MethodsSeciton walletInfo={support} />
                  <EncryptionSection walletInfo={support} />
                  <NotificationsSection walletInfo={support} />
                  <WalletSummary walletInfo={support} />
                  <RawWalletInfo walletInfo={support} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
