/**
 * Create and parse wallet authentication URIs for Nostr Wallet Connect (NIP-47)
 * @tags nwc, wallet, nip-47, authentication
 * @related nwc/connection-string, nwc/simple-wallet
 */
import {
  CommonWalletMethods,
  createWalletAuthURI,
  NotificationType,
  parseWalletAuthURI,
  WalletAuthURI,
} from "applesauce-wallet-connect/helpers";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "../../components/qr-code";

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

const NOTIFICATION_DESCRIPTIONS: Record<NotificationType, string> = {
  payment_received: "Notify when payments are received",
  payment_sent: "Notify when payments are sent",
};

const BUDGET_RENEWAL_OPTIONS = ["never", "daily", "weekly", "monthly", "yearly"] as const;

// Form data type for react-hook-form
type FormData = {
  client: string;
  walletName: string;
  relays: string[];
  name: string;
  icon: string;
  returnTo: string;
  expiresAt: string;
  maxAmount: string;
  budgetRenewal: "never" | "daily" | "weekly" | "monthly" | "yearly";
  methods: string[];
  notifications: NotificationType[];
  isolated: boolean;
  metadata: Record<string, string>;
};

function ParsedUriDisplay({ parsedUri }: { parsedUri?: WalletAuthURI | null }) {
  if (!parsedUri) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Parsed Authorization URI</h2>
      <div className="card card-border bg-base-200">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Client (Pubkey):</span>
              <code className="px-2 py-1 rounded text-sm font-mono block mt-1">{parsedUri.client}</code>
            </div>
            <div>
              <span className="font-medium">Wallet Name:</span>
              <code className="px-2 py-1 rounded text-sm font-mono block mt-1">
                {parsedUri.walletName || "Default"}
              </code>
            </div>
            <div>
              <span className="font-medium">App Name:</span>
              <code className="px-2 py-1 rounded text-sm font-mono block mt-1">
                {parsedUri.name || "Not specified"}
              </code>
            </div>
            <div>
              <span className="font-medium">Isolated:</span>
              <span className={`badge ${parsedUri.isolated ? "badge-warning" : "badge-neutral"} ml-2`}>
                {parsedUri.isolated ? "Yes" : "No"}
              </span>
            </div>
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

          {parsedUri.icon && (
            <div>
              <span className="font-medium">Icon:</span>
              <div className="mt-1">
                <img src={parsedUri.icon} alt="App icon" className="w-8 h-8 rounded" />
                <code className="px-2 py-1 rounded text-sm font-mono ml-2">{parsedUri.icon}</code>
              </div>
            </div>
          )}

          {parsedUri.returnTo && (
            <div>
              <span className="font-medium">Return URL:</span>
              <code className="px-2 py-1 rounded text-sm font-mono block mt-1">{parsedUri.returnTo}</code>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Expires At:</span>
              <div className="mt-1">
                {parsedUri.expiresAt ? (
                  <code className="px-2 py-1 rounded text-sm font-mono">
                    {new Date(parsedUri.expiresAt * 1000).toLocaleString()}
                  </code>
                ) : (
                  <span className="text-sm opacity-70">Never expires</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium">Max Amount:</span>
              <div className="mt-1">
                {parsedUri.maxAmount ? (
                  <code className="px-2 py-1 rounded text-sm font-mono">{parsedUri.maxAmount} msats</code>
                ) : (
                  <span className="text-sm opacity-70">No limit</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="font-medium">Budget Renewal:</span>
            <code className="px-2 py-1 rounded text-sm font-mono ml-2">{parsedUri.budgetRenewal || "never"}</code>
          </div>

          {parsedUri.methods && parsedUri.methods.length > 0 && (
            <div>
              <span className="font-medium">Requested Methods:</span>
              <div className="mt-1 space-y-1">
                {parsedUri.methods.map((method) => (
                  <div key={method} className="ml-2">
                    <code className="px-2 py-1 rounded text-sm font-mono">{method}</code>
                    <span className="text-sm opacity-70 ml-2">- {METHOD_DESCRIPTIONS[method]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedUri.notifications && parsedUri.notifications.length > 0 && (
            <div>
              <span className="font-medium">Notification Types:</span>
              <div className="mt-1 space-y-1">
                {parsedUri.notifications.map((notification) => (
                  <div key={notification} className="ml-2">
                    <code className="px-2 py-1 rounded text-sm font-mono">{notification}</code>
                    <span className="text-sm opacity-70 ml-2">- {NOTIFICATION_DESCRIPTIONS[notification]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedUri.metadata && (
            <div>
              <span className="font-medium">Metadata:</span>
              <div className="mt-1">
                <code className="text-sm font-mono whitespace-pre bg-base-300 p-2 rounded block">
                  {JSON.stringify(parsedUri.metadata, null, 2)}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UriBuilder({ onUriGenerated }: { onUriGenerated: (uri: string) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      client: getPublicKey(generateSecretKey()),
      walletName: "",
      relays: ["wss://relay.getalby.com/v1"],
      name: "",
      icon: "",
      returnTo: "",
      expiresAt: "",
      maxAmount: "",
      budgetRenewal: "never",
      methods: ["get_info", "get_balance", "pay_invoice", "make_invoice"],
      notifications: [],
      isolated: false,
      metadata: {},
    },
  });

  const watchedMethods = watch("methods") || [];
  const watchedNotifications = watch("notifications") || [];
  const watchedMetadata = watch("metadata") || {};
  const watchedRelays = watch("relays") || [];

  const [metadataKey, setMetadataKey] = useState("");
  const [metadataValue, setMetadataValue] = useState("");

  const addRelay = () => {
    const currentRelays = [...watchedRelays];
    currentRelays.push("");
    setValue("relays", currentRelays);
  };

  const removeRelay = (index: number) => {
    if (watchedRelays.length > 1) {
      const currentRelays = watchedRelays.filter((_, i) => i !== index);
      setValue("relays", currentRelays);
    }
  };

  const updateRelay = (index: number, value: string) => {
    const currentRelays = [...watchedRelays];
    currentRelays[index] = value;
    setValue("relays", currentRelays);
  };

  const toggleMethod = (method: string) => {
    const currentMethods = watchedMethods;
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter((m) => m !== method)
      : [...currentMethods, method];
    setValue("methods", newMethods);
  };

  const toggleNotification = (notification: NotificationType) => {
    const currentNotifications = watchedNotifications;
    const newNotifications = currentNotifications.includes(notification)
      ? currentNotifications.filter((n) => n !== notification)
      : [...currentNotifications, notification];
    setValue("notifications", newNotifications);
  };

  const addMetadata = () => {
    if (metadataKey && metadataValue) {
      const currentMetadata = { ...watchedMetadata };
      currentMetadata[metadataKey] = metadataValue;
      setValue("metadata", currentMetadata);
      setMetadataKey("");
      setMetadataValue("");
    }
  };

  const removeMetadata = (key: string) => {
    const currentMetadata = { ...watchedMetadata };
    delete currentMetadata[key];
    setValue("metadata", currentMetadata);
  };

  const onSubmit = (data: FormData) => {
    try {
      // Convert form data to WalletAuthURI format
      const walletAuthData: WalletAuthURI = {
        client: data.client,
        walletName: data.walletName || undefined,
        relays: data.relays.filter((relay) => relay.trim()),
        name: data.name || undefined,
        icon: data.icon || undefined,
        returnTo: data.returnTo || undefined,
        expiresAt: data.expiresAt ? Math.floor(new Date(data.expiresAt).getTime() / 1000) : undefined,
        maxAmount: data.maxAmount ? parseInt(data.maxAmount) : undefined,
        budgetRenewal: data.budgetRenewal,
        methods: data.methods as CommonWalletMethods["method"][],
        notifications: data.notifications,
        isolated: data.isolated,
        metadata: data.metadata,
      };

      const uri = createWalletAuthURI(walletAuthData);
      onUriGenerated(uri);
    } catch (error) {
      alert(`Error generating URI: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Build Authorization URI</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="card card-border bg-base-200">
        <div className="card-body space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Client Public Key *</span>
              </label>
              <input
                {...register("client", { required: "Client public key is required" })}
                type="text"
                placeholder="npub1..."
                className="input input-bordered w-full"
              />
              {errors.client && <span className="text-error text-sm">{errors.client.message}</span>}
            </div>
            <div>
              <label className="label">
                <span className="label-text">Wallet Name</span>
              </label>
              <input
                {...register("walletName")}
                type="text"
                placeholder="walletname (optional)"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          {/* Relays */}
          <div>
            <label className="label">
              <span className="label-text">Relays *</span>
            </label>
            <div className="space-y-2">
              {watchedRelays.map((relay: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={relay}
                    onChange={(e) => updateRelay(index, e.target.value)}
                    placeholder="wss://relay.example.com"
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeRelay(index)}
                    disabled={watchedRelays.length <= 1}
                    className="btn btn-square btn-sm btn-error"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={addRelay} className="btn btn-sm btn-outline">
                Add Relay
              </button>
            </div>
          </div>

          {/* App Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">App Name</span>
              </label>
              <input {...register("name")} type="text" placeholder="My App" className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label">
                <span className="label-text">App Icon URL</span>
              </label>
              <input
                {...register("icon")}
                type="url"
                placeholder="https://example.com/icon.png"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Return URL</span>
            </label>
            <input
              {...register("returnTo")}
              type="url"
              placeholder="https://example.com/return"
              className="input input-bordered w-full"
            />
          </div>

          {/* Budget and Expiration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Expires At</span>
              </label>
              <input {...register("expiresAt")} type="datetime-local" className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Max Amount (msats)</span>
              </label>
              <input
                {...register("maxAmount")}
                type="number"
                placeholder="1000000"
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Budget Renewal</span>
              </label>
              <select {...register("budgetRenewal")} className="select select-bordered w-full">
                {BUDGET_RENEWAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Methods */}
          <div>
            <label className="label">
              <span className="label-text">Request Methods</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(METHOD_DESCRIPTIONS).map(([method]) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedMethods.includes(method)}
                    onChange={() => toggleMethod(method)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="label">
              <span className="label-text">Notification Types</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(NOTIFICATION_DESCRIPTIONS).map(([notification]) => (
                <label key={notification} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchedNotifications.includes(notification as NotificationType)}
                    onChange={() => toggleNotification(notification as NotificationType)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">{notification}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="label cursor-pointer">
              <span className="label-text">Isolated Connection</span>
              <input {...register("isolated")} type="checkbox" className="checkbox" />
            </label>
          </div>

          {/* Metadata */}
          <div>
            <label className="label">
              <span className="label-text">Metadata</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
                placeholder="Key"
                className="input input-bordered flex-1"
              />
              <input
                type="text"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                placeholder="Value"
                className="input input-bordered flex-1"
              />
              <button type="button" onClick={addMetadata} className="btn btn-sm btn-primary">
                Add
              </button>
            </div>
            {Object.keys(watchedMetadata).length > 0 && (
              <div className="space-y-1">
                {Object.entries(watchedMetadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <code className="px-2 py-1 rounded bg-base-300">
                      {key}: {value}
                    </code>
                    <button type="button" onClick={() => removeMetadata(key)} className="btn btn-xs btn-error">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary">
            Generate URI
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AuthUriExample() {
  const [inputUri, setInputUri] = useState("");
  const [parsedUri, setParsedUri] = useState<WalletAuthURI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedUri, setGeneratedUri] = useState("");

  // Handle URI input and parsing
  const handleUriChange = (value: string) => {
    setInputUri(value);
    setError(null);
    setParsedUri(null);

    if (!value.trim()) return;

    try {
      const parsed = parseWalletAuthURI(value);
      setParsedUri(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse URI");
    }
  };

  // Handle URI generation
  const handleUriGenerated = (uri: string) => {
    setGeneratedUri(uri);
    setInputUri(uri);
    setError(null);

    try {
      const parsed = parseWalletAuthURI(uri);
      setParsedUri(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse generated URI");
    }
  };

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Nostr Wallet Auth URI</h1>
        <p className="mb-4 opacity-70">Parse, create, and validate nostr+walletauth URIs for wallet authorization.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - URI Builder */}
          <div>
            <UriBuilder onUriGenerated={handleUriGenerated} />
          </div>

          {/* Right Column - URI Parser */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Parse Authorization URI</h2>

            <div className="mb-4">
              <label className="label">
                <span className="label-text">Authorization URI</span>
              </label>
              <textarea
                value={inputUri}
                onChange={(e) => handleUriChange(e.target.value)}
                placeholder="nostr+walletauth://clientpubkey?relay=wss://relay.example.com&name=MyApp"
                className="textarea textarea-bordered w-full"
                rows={4}
              />
              {error && <p className="mt-2 text-sm text-error">{error}</p>}
            </div>

            {/* Generated URI Display */}
            {generatedUri && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Generated URI:</h3>
                <div className="card card-border bg-base-200">
                  <QRCode
                    value={generatedUri}
                    size={300}
                    className="rounded mx-auto"
                    alt="Generated wallet auth QR code"
                  />
                  <div className="card-body">
                    <code className="text-sm font-mono break-all select-all">{generatedUri}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedUri)}
                      className="btn btn-sm btn-outline mt-2"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parsed URI Display */}
        {parsedUri && <ParsedUriDisplay parsedUri={parsedUri} />}
      </div>
    </div>
  );
}
