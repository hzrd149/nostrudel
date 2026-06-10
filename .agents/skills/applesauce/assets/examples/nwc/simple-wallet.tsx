/**
 * Simple wallet interface for paying invoices and sending Lightning payments via Nostr Wallet Connect
 * @tags nip-47, nwc, wallet, lightning, payments
 * @related nwc/transactions, nwc/wallet-info
 */
import { parseBolt11, ParsedInvoice } from "applesauce-common/helpers";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { WalletConnect } from "applesauce-wallet-connect";
import {
  GetBalanceMethod,
  parseWalletConnectURI,
  PayInvoiceMethod,
  supportsMethod,
  Transaction,
  WalletSupport,
} from "applesauce-wallet-connect/helpers";
import { generateSecretKey } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { of } from "rxjs";
import QRCode from "../../components/qr-code";
import RelayPicker from "../../components/relay-picker";

// Create a relay pool to make relay connections
const pool = new RelayPool();

function formatMsats(msats: number): string {
  const sats = Math.floor(msats / 1000);
  return sats.toLocaleString();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, index) => (
        <div key={index} className="card card-border bg-base-200">
          <div className="card-body p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${tx.type === "incoming" ? "badge-success" : "badge-warning"}`}>
                    {tx.type}
                  </span>
                  <span
                    className={`badge badge-outline ${
                      tx.state === "settled"
                        ? "badge-success"
                        : tx.state === "pending"
                          ? "badge-warning"
                          : "badge-error"
                    }`}
                  >
                    {tx.state}
                  </span>
                </div>
                {tx.description && <p className="text-sm text-gray-600 mb-1">{tx.description}</p>}
                <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {tx.type === "incoming" ? "+" : "-"}
                  {formatMsats(tx.amount)} sats
                </div>
                {tx.fees_paid > 0 && <div className="text-xs text-gray-500">Fee: {formatMsats(tx.fees_paid)} sats</div>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateInvoiceModal({
  isOpen,
  onClose,
  wallet,
  support,
}: {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletConnect;
  support?: WalletSupport | null;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Transaction | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  // Listen for payment notifications
  const notifications = use$(() => wallet?.notifications$, [wallet]);

  // Check if notifications are supported
  const supportsNotifications = support?.notifications?.includes("payment_received");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDescription("");
      setError(null);
      setInvoice(null);
      setIsPaid(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Listen for payment notifications to detect when invoice is paid
  useEffect(() => {
    if (notifications && invoice && !isPaid) {
      // Check if this notification is for our invoice
      if (
        notifications.notification_type === "payment_received" &&
        notifications.notification.payment_hash === invoice.payment_hash
      ) {
        setIsPaid(true);
      }
    }
  }, [notifications, invoice, isPaid]);

  const handleCreateInvoice = async () => {
    if (!wallet || !amount) return;

    setLoading(true);
    setError(null);

    try {
      const amountMsats = parseInt(amount) * 1000; // Convert sats to msats
      const result = await wallet.makeInvoice(amountMsats, {
        description: description || undefined,
        expiry: 3600, // 1 hour expiry
      });
      setInvoice(result);
    } catch (err) {
      console.error("Failed to create invoice:", err);
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvoice(null);
    setIsPaid(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Create Invoice</h3>

        {!invoice ? (
          // Invoice creation form
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount (sats)</span>
              </label>
              <input
                type="number"
                placeholder="1000"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description (optional)</span>
              </label>
              <input
                type="text"
                placeholder="Payment for..."
                className="input input-bordered w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!supportsNotifications && (
              <div className="alert alert-warning">
                This wallet does not support payment notifications. You won't be notified when the invoice is paid.
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={loading || !amount}>
                {loading ? <span className="loading loading-spinner loading-sm"></span> : "Create Invoice"}
              </button>
            </div>
          </div>
        ) : (
          // Invoice display with QR code
          <div className="space-y-4">
            {isPaid ? (
              <div className="alert alert-success">Invoice has been paid!</div>
            ) : (
              <div className="text-center">
                <p className="mb-4">Invoice created! Share this QR code or payment request:</p>

                {/* QR Code */}
                {invoice.invoice && (
                  <div className="flex justify-center mb-4">
                    <QRCode value={invoice.invoice} size={200} className="rounded" alt="Invoice QR code" />
                  </div>
                )}

                {/* Invoice details */}
                <div className="card card-border bg-base-200 text-left">
                  <div className="card-body p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Amount:</span>
                        <span className="ml-2">{formatMsats(invoice.amount)} sats</span>
                      </div>
                      {invoice.description && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <span className="ml-2">{invoice.description}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 badge ${invoice.state === "pending" ? "badge-warning" : "badge-success"}`}
                        >
                          {invoice.state}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment request string */}
                {invoice.invoice && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Payment Request</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered rounded text-xs w-full"
                      value={invoice.invoice}
                      readOnly
                      rows={3}
                    />
                  </div>
                )}

                {supportsNotifications && <div className="alert mt-2">Waiting for payment...</div>}
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleClose}>
                {isPaid ? "Close" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}

function PayInvoiceModal({
  isOpen,
  onClose,
  wallet,
}: {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletConnect | undefined;
}) {
  const [invoiceString, setInvoiceString] = useState("");
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PayInvoiceMethod["response"]["result"] | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInvoiceString("");
      setParsedInvoice(null);
      setParseError(null);
      setPaymentResult(null);
      setPaymentError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Parse invoice when input changes
  useEffect(() => {
    if (!invoiceString.trim()) {
      setParsedInvoice(null);
      setParseError(null);
      return;
    }

    try {
      const parsed = parseBolt11(invoiceString.trim());
      setParsedInvoice(parsed);
      setParseError(null);
    } catch (err) {
      console.error("Failed to parse invoice:", err);
      setParsedInvoice(null);
      setParseError(err instanceof Error ? err.message : "Invalid invoice format");
    }
  }, [invoiceString]);

  const handlePayInvoice = async () => {
    if (!wallet || !parsedInvoice) return;

    setLoading(true);
    setPaymentError(null);

    try {
      const result = await wallet.payInvoice(invoiceString.trim());
      setPaymentResult(result);
    } catch (err) {
      console.error("Failed to pay invoice:", err);
      setPaymentError(err instanceof Error ? err.message : "Failed to pay invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentResult(null);
    onClose();
  };

  const isExpired = parsedInvoice ? Date.now() / 1000 > parsedInvoice.expiry : false;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Pay Invoice</h3>

        {!paymentResult ? (
          <div className="space-y-4">
            {/* Invoice Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Lightning Invoice</span>
              </label>
              <textarea
                placeholder="Paste Lightning invoice (lnbc...)"
                className="textarea textarea-bordered w-full"
                rows={4}
                value={invoiceString}
                onChange={(e) => setInvoiceString(e.target.value)}
              />
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="alert alert-error">
                <span className="text-sm">{parseError}</span>
              </div>
            )}

            {/* Invoice Details */}
            {parsedInvoice && !parseError && (
              <div className="card card-border bg-base-200">
                <div className="card-body p-4">
                  <h4 className="font-semibold mb-2">Invoice Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Amount:</span>
                      <span className="ml-2">
                        {parsedInvoice.amount ? `${formatMsats(parsedInvoice.amount)} sats` : "No amount specified"}
                      </span>
                    </div>
                    {parsedInvoice.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <span className="ml-2">{parsedInvoice.description}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{formatDate(parsedInvoice.timestamp)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>
                      <span className={`ml-2 ${isExpired ? "text-error" : ""}`}>
                        {formatDate(parsedInvoice.expiry)}
                        {isExpired && " (Expired)"}
                      </span>
                    </div>
                    {parsedInvoice.paymentHash && (
                      <div>
                        <span className="font-medium">Payment Hash:</span>
                        <code className="ml-2 text-xs break-all">{parsedInvoice.paymentHash}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Expiry Warning */}
            {parsedInvoice && isExpired && (
              <div className="alert alert-warning">This invoice has expired and cannot be paid.</div>
            )}

            {/* Payment Error */}
            {paymentError && (
              <div className="alert alert-error">
                <span className="text-sm">{paymentError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={handlePayInvoice}
                disabled={loading || !parsedInvoice || parseError !== null || isExpired}
              >
                {loading ? <span className="loading loading-spinner loading-sm"></span> : "Pay Invoice"}
              </button>
            </div>
          </div>
        ) : (
          // Payment Success
          <div className="space-y-4">
            <div className="alert alert-success">Payment successful!</div>

            <div className="card card-border bg-base-200">
              <div className="card-body p-4">
                <h4 className="font-semibold mb-2">Payment Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Preimage:</span>
                    <code className="ml-2 text-xs break-all">{paymentResult.preimage}</code>
                  </div>
                  {paymentResult.fees_paid && paymentResult.fees_paid > 0 && (
                    <div>
                      <span className="font-medium">Fees Paid:</span>
                      <span className="ml-2">{formatMsats(paymentResult.fees_paid)} sats</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}

function ConnectionUriInput({ onConnect }: { onConnect: (wallet: WalletConnect) => void }) {
  const [uri, setUri] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUriChange = (value: string) => {
    setUri(value);
    setError(null);

    if (!value.trim()) return;

    try {
      parseWalletConnectURI(value);
      // If parsing succeeds, call onConnect with the valid URI
      const wallet = WalletConnect.fromConnectURI(value, { pool });
      onConnect(wallet);
    } catch (err) {
      console.error("Failed to parse URI:", err);
      setError(err instanceof Error ? err.message : "Failed to parse URI");
    }
  };

  return (
    <div className="space-y-2">
      <label className="label">
        <span className="label-text">Connection String</span>
      </label>
      <textarea
        value={uri}
        onChange={(e) => handleUriChange(e.target.value)}
        placeholder="nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=secretkey"
        className="textarea textarea-bordered w-full"
        rows={3}
      />
      {error && (
        <div className="alert alert-error">
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}

function ConnectAuthUri({ onConnect }: { onConnect: (wallet: WalletConnect) => void }) {
  const [relay, setRelay] = useState<string>("wss://relay.getalby.com/v1");
  const wallet = useMemo(() => new WalletConnect({ pool, relays: [relay], secret: generateSecretKey() }), [relay]);

  useEffect(() => {
    let connected = false;
    const controller = new AbortController();

    // Start waiting for the service to connect
    wallet
      .waitForService(controller.signal)
      .then(() => {
        connected = true;
        onConnect(wallet);
      })
      .catch(() => {});

    // Cleanup function to abort the waiting process
    return () => {
      if (!connected) controller.abort();
    };
  }, [wallet]);

  const uri = useMemo(
    () =>
      wallet.getAuthURI({ methods: ["get_balance", "get_info", "make_invoice", "pay_invoice"], name: "applesauce" }),
    [wallet],
  );

  return (
    <div className="gap-2 flex flex-col items-center">
      <a href={uri} className="bg-white p-4 rounded-lg">
        <QRCode value={uri} size={192} className="h-48 w-48" alt="Wallet auth QR code" />
      </a>
      <RelayPicker value={relay} onChange={setRelay} common={["wss://relay.getalby.com/v1"]} className="w-full" />
      <a href={uri} className="btn btn-primary btn-block">
        Connect
      </a>
      <code className="text-xs break-all select-all">{uri}</code>
    </div>
  );
}

export default function SimpleWalletExample() {
  const [wallet, setWallet] = useState<WalletConnect | undefined>(undefined);

  const [balance, setBalance] = useState<GetBalanceMethod["response"]["result"] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);

  // Handle connection from URI input component
  const handleConnect = (wallet: WalletConnect) => {
    try {
      setWallet(wallet);
      setBalance(null);
      setTransactions([]);
    } catch (err) {
      console.error("Failed to parse URI:", err);
      // Error handling is done in the ConnectionUriInput component
    }
  };

  // Get wallet capabilities to check supported methods
  const support = use$(() => wallet?.support$ ?? of(undefined), [wallet]);

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!wallet || !support) return;

    if (!supportsMethod(support, "get_balance")) return;

    setBalanceLoading(true);
    try {
      const balanceResult = await wallet.getBalance();
      setBalance(balanceResult);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch wallet transactions
  const fetchTransactions = async () => {
    if (!wallet || !support) return;

    if (!supportsMethod(support, "list_transactions")) return;

    setTransactionsLoading(true);
    try {
      const txResult = await wallet.listTransactions({ limit: 20 });
      setTransactions(txResult.transactions);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Auto-fetch data when wallet becomes available
  useEffect(() => {
    if (wallet && support) {
      fetchBalance();
      fetchTransactions();
    }
  }, [wallet, support]);

  // Disconnect function
  const handleDisconnect = () => {
    setWallet(undefined);
    setBalance(null);
    setTransactions([]);
  };

  const canMakeInvoice = support && supportsMethod(support, "make_invoice");
  const canPayInvoice = support && supportsMethod(support, "pay_invoice");
  const canListTransactions = support && supportsMethod(support, "list_transactions");

  return (
    <div className="container mx-auto max-w-md px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Simple NWC Wallet</h1>
          <p className="text-sm opacity-70">Connect to your Nostr Wallet Connect enabled wallet</p>
        </div>

        {/* Connection URI Input Component */}
        {!wallet && (
          <>
            <ConnectAuthUri onConnect={handleConnect} />
            <ConnectionUriInput onConnect={handleConnect} />
          </>
        )}

        {/* Connecting State */}
        {wallet && support === undefined && (
          <div className="flex justify-center items-center gap-2 py-4">
            <span className="loading loading-spinner loading-md"></span>
            <span>Connecting to wallet...</span>
          </div>
        )}

        {/* Connection Failed */}
        {wallet && support === null && (
          <div className="alert alert-warning">
            <span className="text-sm">Wallet offline or not found. Please check your connection string.</span>
          </div>
        )}

        {/* Disconnect Button - Only show when connected */}
        {wallet && (
          <div className="flex justify-center">
            <button onClick={handleDisconnect} className="btn btn-sm btn-ghost">
              Disconnect
            </button>
          </div>
        )}

        {/* Balance Display */}
        {wallet && support && (
          <div className="card card-border bg-primary text-primary-content">
            <div className="card-body p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Balance</h2>
              {balanceLoading ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : balance ? (
                <div className="text-3xl font-bold">{formatMsats(balance.balance)} sats</div>
              ) : (
                <div className="text-lg opacity-70">
                  {supportsMethod(support, "get_balance") ? "Unable to load" : "Not supported"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {wallet && support && (
          <div className="grid grid-cols-2 gap-4">
            <button
              className="btn btn-success"
              disabled={!canMakeInvoice}
              onClick={() => setShowCreateInvoiceModal(true)}
            >
              Create Invoice
            </button>
            <button className="btn btn-warning" disabled={!canPayInvoice} onClick={() => setShowPayInvoiceModal(true)}>
              Pay Invoice
            </button>
          </div>
        )}

        {/* Transactions List */}
        {wallet && support && canListTransactions && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <button onClick={fetchTransactions} disabled={transactionsLoading} className="btn btn-sm btn-ghost">
                {transactionsLoading ? <span className="loading loading-spinner loading-sm"></span> : "Refresh"}
              </button>
            </div>

            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
          </div>
        )}

        {/* No transactions support message */}
        {wallet && support && !canListTransactions && (
          <div className="alert alert-info">
            <span className="text-sm">This wallet does not support transaction history.</span>
          </div>
        )}

        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          isOpen={showCreateInvoiceModal}
          onClose={() => {
            setShowCreateInvoiceModal(false);
            // Refresh balance and transactions when modal closes
            if (wallet && support) {
              fetchBalance();
              fetchTransactions();
            }
          }}
          wallet={wallet}
          support={support}
        />

        {/* Pay Invoice Modal */}
        <PayInvoiceModal
          isOpen={showPayInvoiceModal}
          onClose={() => {
            setShowPayInvoiceModal(false);
            // Refresh balance and transactions when modal closes
            if (wallet && support) {
              fetchBalance();
              fetchTransactions();
            }
          }}
          wallet={wallet}
        />
      </div>
    </div>
  );
}
