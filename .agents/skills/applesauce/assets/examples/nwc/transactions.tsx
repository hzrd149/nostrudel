/**
 * View and manage wallet transaction history with filtering and details
 * @tags nip-47, nwc, wallet, transactions
 * @related nwc/simple-wallet, nwc/wallet-info
 */
import { hexToBytes } from "@noble/hashes/utils";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { WalletConnect } from "applesauce-wallet-connect";
import { parseWalletConnectURI, supportsMethod, Transaction } from "applesauce-wallet-connect/helpers";
import { useCallback, useMemo, useState } from "react";

// Create a relay pool to make relay connections
const pool = new RelayPool();

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isIncoming = transaction.type === "incoming";
  const isSettled = transaction.state === "settled";
  const isPending = transaction.state === "pending";
  const isFailed = transaction.state === "failed";
  const isExpired = transaction.state === "expired";

  // Format amount from msats to sats
  const amountSats = Math.floor(transaction.amount / 1000);
  const feesSats = Math.floor(transaction.fees_paid / 1000);

  // Format timestamps
  const createdDate = new Date(transaction.created_at * 1000);
  const settledDate = transaction.settled_at ? new Date(transaction.settled_at * 1000) : null;
  const expiresDate = transaction.expires_at ? new Date(transaction.expires_at * 1000) : null;

  // Get status badge class
  const getStatusBadgeClass = () => {
    if (isSettled) return "badge-success";
    if (isPending) return "badge-warning";
    if (isFailed) return "badge-error";
    if (isExpired) return "badge-ghost";
    return "badge-outline";
  };

  return (
    <div className="w-full p-4 border border-base-300 rounded-lg bg-base-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isIncoming ? (isSettled ? "bg-success" : "bg-warning") : isSettled ? "bg-info" : "bg-warning"
            }`}
          />
          <div className={`badge ${isIncoming ? "badge-success" : "badge-info"}`}>
            {isIncoming ? "↓ Incoming" : "↑ Outgoing"}
          </div>
          <div className={`badge ${getStatusBadgeClass()}`}>{transaction.state}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${isIncoming ? "text-success" : "text-info"}`}>
            {isIncoming ? "+" : "-"}
            {amountSats.toLocaleString()} sats
          </div>
          {feesSats > 0 && <div className="text-xs opacity-60">Fee: {feesSats.toLocaleString()} sats</div>}
        </div>
      </div>

      {transaction.description && (
        <div className="mb-3">
          <span className="font-medium">Description: </span>
          <span className="text-sm">{transaction.description}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs opacity-70 mb-2">
        <div>
          <span className="font-medium">Payment Hash: </span>
          <code className="break-all">{transaction.payment_hash}</code>
        </div>
        {transaction.preimage && (
          <div>
            <span className="font-medium">Preimage: </span>
            <code className="break-all">{transaction.preimage}</code>
          </div>
        )}
        {settledDate && (
          <div>
            <span className="font-medium">Settled: </span>
            {settledDate.toLocaleString()}
          </div>
        )}
        {expiresDate && !isSettled && (
          <div>
            <span className="font-medium">Expires: </span>
            {expiresDate.toLocaleString()}
          </div>
        )}
      </div>

      {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
        <details className="mb-2">
          <summary className="cursor-pointer text-xs font-medium opacity-70">Metadata</summary>
          <pre className="text-xs mt-1 p-2 bg-base-300 rounded overflow-x-auto">
            {JSON.stringify(transaction.metadata, null, 2)}
          </pre>
        </details>
      )}

      <div className="text-xs opacity-60 mt-2 pt-2 border-t border-base-300">
        <time className="font-mono">{createdDate.toLocaleString()}</time>
      </div>
    </div>
  );
}

function TransactionTimeline({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl opacity-20 mb-4">📝</div>
        <p className="text-lg opacity-60">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Transactions</h2>
      <div className="space-y-2">
        {transactions.map((transaction, index) => (
          <TransactionItem key={`${transaction.payment_hash}-${index}`} transaction={transaction} />
        ))}
      </div>
    </>
  );
}

export default function TransactionsExample() {
  const [uri, setUri] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parseWalletConnectURI> | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [methodError, setMethodError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [transactionType, setTransactionType] = useState<"incoming" | "outgoing" | undefined>(undefined);
  const [includeUnpaid, setIncludeUnpaid] = useState(false);

  const pageSize = 20;

  // Handle URI input and parsing
  const handleUriChange = (value: string) => {
    setUri(value);
    setError(null);
    setParsed(null);
    setTransactions([]);
    setMethodError(null);
    setCurrentPage(0);
    setHasMore(true);

    if (!value.trim()) return;

    try {
      const parsed = parseWalletConnectURI(value);
      setParsed(parsed);
    } catch (err) {
      console.error("Failed to parse URI:", err);
      setError(err instanceof Error ? err.message : "Failed to parse URI");
    }
  };

  // Create WalletConnect instance
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

      return walletConnect;
    } catch (err) {
      console.error("Failed to create wallet connection:", err);
      return undefined;
    }
  }, [parsed]);

  // Get wallet capabilities to check if list_transactions is supported
  const support = use$(() => wallet?.support$, [wallet]);

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (page: number = 0, append: boolean = false) => {
      if (!wallet) return;

      // Check if list_transactions method is supported
      if (support && !supportsMethod(support, "list_transactions")) {
        setMethodError("The connected wallet does not support the 'list_transactions' method.");
        return;
      }

      setLoading(true);
      setError(null);
      setMethodError(null);

      try {
        const params = {
          limit: pageSize,
          offset: page * pageSize,
          type: transactionType,
          unpaid: includeUnpaid,
        };

        const result = await wallet.listTransactions(params);

        if (append) {
          setTransactions((prev) => [...prev, ...result.transactions]);
        } else {
          setTransactions(result.transactions);
        }

        // Check if there are more transactions
        setHasMore(result.transactions.length === pageSize);
        setCurrentPage(page);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    },
    [wallet, support, transactionType, includeUnpaid, pageSize],
  );

  // Load more transactions
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTransactions(currentPage + 1, true);
    }
  }, [fetchTransactions, currentPage, loading, hasMore]);

  // Refresh transactions (reset to first page)
  const refresh = useCallback(() => {
    setCurrentPage(0);
    setHasMore(true);
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  // Handle filter changes
  const handleTypeChange = (type: "incoming" | "outgoing" | undefined) => {
    setTransactionType(type);
    setCurrentPage(0);
    setHasMore(true);
    setTransactions([]);
  };

  const handleUnpaidChange = (unpaid: boolean) => {
    setIncludeUnpaid(unpaid);
    setCurrentPage(0);
    setHasMore(true);
    setTransactions([]);
  };

  return (
    <div className="container mx-auto my-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="mb-4 opacity-70">
          Enter a nostr+walletconnect URI to connect to a wallet and view its transaction history using the
          list_transactions method.
        </p>

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

        {/* Connection Status and Actions */}
        {parsed && (
          <div className="my-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center my-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Transaction Type</span>
                </label>
                <select
                  className="select select-bordered select-sm"
                  value={transactionType || "all"}
                  onChange={(e) =>
                    handleTypeChange(e.target.value === "all" ? undefined : (e.target.value as "incoming" | "outgoing"))
                  }
                >
                  <option value="all">All</option>
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text mr-2">Include Unpaid</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={includeUnpaid}
                    onChange={(e) => handleUnpaidChange(e.target.checked)}
                  />
                </label>
              </div>

              <div className="join ms-auto">
                <button onClick={refresh} disabled={loading} className="btn join-item btn-primary">
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Loading...
                    </>
                  ) : (
                    "Fetch Transactions"
                  )}
                </button>

                {transactions.length > 0 && (
                  <button onClick={refresh} disabled={loading} className="btn join-item btn-outline">
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Method Not Supported Warning */}
        {methodError && (
          <div className="alert alert-warning mb-8">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Method Not Supported</h3>
                <div className="text-xs">{methodError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Display */}
        {transactions.length > 0 && (
          <>
            <TransactionTimeline transactions={transactions} />

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-6">
                <button onClick={loadMore} disabled={loading} className="btn btn-outline btn-wide">
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Loading more...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}

            {/* Transaction Count Info */}
            <div className="text-center mt-4 opacity-60">
              <p className="text-sm">
                Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                {!hasMore && transactions.length > pageSize && " (all loaded)"}
              </p>
            </div>
          </>
        )}

        {/* Empty State */}
        {transactions.length === 0 && !loading && support && !methodError && (
          <div className="text-center py-12">
            <div className="text-6xl opacity-20 mb-4">💸</div>
            <p className="text-xl opacity-60 mb-2">No transactions yet</p>
            <p className="opacity-40">Connect to a wallet and fetch transactions to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
