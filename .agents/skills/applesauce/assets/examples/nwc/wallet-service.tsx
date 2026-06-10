/**
 * Implement a wallet service that handles Nostr Wallet Connect requests and payments
 * @tags nip-47, nwc, wallet, service, server
 * @related nwc/simple-wallet
 */
import { parseBolt11 } from "applesauce-common/helpers";
import { unixNow } from "applesauce-core/helpers";
import { useObservableEagerState } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { PrivateKeySigner } from "applesauce-signers";
import { WalletService, WalletServiceHandlers } from "applesauce-wallet-connect";
import { CommonWalletMethods, WalletInfo, Transaction as WalletTransaction } from "applesauce-wallet-connect/helpers";
import { InsufficientBalanceError, NotFoundError } from "applesauce-wallet-connect/helpers/error";
import { useCallback, useMemo, useState } from "react";
import { BehaviorSubject } from "rxjs";
import QRCode from "../../components/qr-code";

// Available wallet methods that can be supported
const AVAILABLE_METHODS = [
  "pay_invoice",
  "multi_pay_invoice",
  "pay_keysend",
  "multi_pay_keysend",
  "make_invoice",
  "lookup_invoice",
  "list_transactions",
  "get_balance",
  "get_info",
] as const;

// Default relay list
const DEFAULT_RELAYS = ["wss://relay.getalby.com/v1", "wss://nos.lol"];

// Initialize relay pool
const pool = new RelayPool();

/** Create a signer for the service */
const signer = new PrivateKeySigner();

// Setup subscription and publish methods
WalletService.subscriptionMethod = pool.subscription.bind(pool);
WalletService.publishMethod = pool.publish.bind(pool);

type Transaction = WalletTransaction & { id: string };

function ConnectionInfo({ connectionString }: { connectionString: string }) {
  return (
    <div className="bg-base-100 rounded-lg shadow p-4 flex gap-2">
      <QRCode value={connectionString} size={128} className="rounded" alt="Wallet connection QR code" />
      <div className="flex flex-col gap-2 items-start">
        <div>
          <h3 className="font-bold">Connection String</h3>
          <code className="text-xs font-mono truncate select-all code">{connectionString}</code>
        </div>
        <button onClick={() => navigator.clipboard.writeText(connectionString)} className="btn btn-accent btn-sm">
          Copy
        </button>
      </div>
    </div>
  );
}

// Card Components
function BalanceCard({ balance, setBalance }: { balance: number; setBalance: (balance: number) => void }) {
  return (
    <div className="bg-base-100 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
        get_balance
      </h3>
      <div className="text-center space-y-4">
        <div className="text-3xl font-bold text-blue-600">{(balance / 1000).toLocaleString()} sats</div>
        <div className="text-sm text-gray-600">{balance.toLocaleString()} msat</div>
        <div className="flex gap-2">
          <button onClick={() => setBalance(balance + 10000 * 1000)} className="btn btn-success flex-1">
            Add 10k sats
          </button>
          <button onClick={() => setBalance(Math.max(0, balance - 10000 * 1000))} className="btn btn-error flex-1 ">
            Remove 10k sats
          </button>
        </div>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value) || 0)}
          className="input w-full"
          placeholder="Set custom balance"
        />
      </div>
    </div>
  );
}

function WalletInfoCard({
  walletInfo,
  updateWalletInfo,
}: {
  walletInfo: WalletInfo;
  updateWalletInfo: (field: string, value: any) => void;
}) {
  return (
    <div className="bg-base-100 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
        get_info
      </h3>
      <div className="space-y-2">
        <label className="label">Alias</label>
        <input
          type="text"
          value={walletInfo.alias}
          onChange={(e) => updateWalletInfo("alias", e.target.value)}
          className="input w-full"
        />
        <label className="label">Color</label>
        <input
          type="color"
          value={walletInfo.color}
          onChange={(e) => updateWalletInfo("color", e.target.value)}
          className="w-full h-10 border rounded-md"
        />
        <label className="label">Network</label>
        <select
          value={walletInfo.network}
          onChange={(e) => updateWalletInfo("network", e.target.value)}
          className="input w-full"
        >
          <option value="mainnet">mainnet</option>
          <option value="testnet">testnet</option>
          <option value="regtest">regtest</option>
        </select>
        <label className="label">Block Height</label>
        <input
          type="number"
          value={walletInfo.block_height}
          onChange={(e) => updateWalletInfo("block_height", Number(e.target.value))}
          className="input w-full"
        />
      </div>
    </div>
  );
}

function TransactionsCard({
  transactions,
  newTransaction,
  setNewTransaction,
  addTransaction,
  removeTransaction,
  settleTransaction,
}: {
  transactions: Transaction[];
  newTransaction: Partial<Transaction>;
  setNewTransaction: (
    transaction: Partial<Transaction> | ((prev: Partial<Transaction>) => Partial<Transaction>),
  ) => void;
  addTransaction: () => void;
  removeTransaction: (id: string) => void;
  settleTransaction: (id: string) => void;
}) {
  return (
    <div className="bg-base-100 rounded-lg shadow p-6 xl:col-span-1 lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
        list_transactions
      </h3>

      {/* Add Transaction Form */}
      <div className="mb-4 p-4 bg-base-200 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Add Transaction</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={newTransaction.type}
            onChange={(e) =>
              setNewTransaction((prev) => ({ ...prev, type: e.target.value as "incoming" | "outgoing" }))
            }
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
          <select
            value={newTransaction.state}
            onChange={(e) =>
              setNewTransaction((prev) => ({
                ...prev,
                state: e.target.value as "pending" | "settled" | "failed",
              }))
            }
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="pending">Pending</option>
            <option value="settled">Settled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-3">
          <input
            type="text"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="px-3 py-2 border rounded-md text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount (sats)"
              className="px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="number"
              value={newTransaction.fees_paid}
              onChange={(e) => setNewTransaction((prev) => ({ ...prev, fees_paid: Number(e.target.value) }))}
              placeholder="Fees (sats)"
              className="px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>
        <button
          onClick={addTransaction}
          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
        >
          Add Transaction
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    tx.type === "incoming" ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span className="text-sm font-medium">{tx.description}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    tx.state === "settled"
                      ? "bg-green-100 text-green-800"
                      : tx.state === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {tx.state}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(tx.amount / 1000).toLocaleString()} sats | Fees: {Math.round(tx.fees_paid / 1000)} sats
              </div>
            </div>
            <div className="flex space-x-2">
              {tx.state === "pending" && (
                <button
                  onClick={() => settleTransaction(tx.id)}
                  className="btn btn-sm btn-success"
                  title="Mark as settled"
                >
                  Settle
                </button>
              )}
              <button onClick={() => removeTransaction(tx.id)} className="btn btn-sm btn-error">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodCard({
  method,
  color,
  description,
  details,
}: {
  method: string;
  color: string;
  description: string;
  details: string;
}) {
  return (
    <div className="bg-base-100 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className={`w-3 h-3 ${color} rounded-full mr-2`}></span>
        {method}
      </h3>
      <div className="text-center text-gray-600">
        <p className="text-sm">{description}</p>
        <p className="text-xs mt-2">{details}</p>
      </div>
    </div>
  );
}

// Create global state (easier to manage outside of the component)
const balance$ = new BehaviorSubject<number>(50000 * 1000);
const walletInfo$ = new BehaviorSubject<WalletInfo>({
  alias: "Example Wallet",
  color: "#3b82f6",
  network: "mainnet",
  block_height: 800000,
  block_hash: "0000000000000000000000000000000000000000000000000000000000000000",
  methods: [],
});
const transactions$ = new BehaviorSubject<Transaction[]>([
  {
    id: "tx1",
    type: "incoming" as const,
    state: "settled" as const,
    description: "Lightning payment received",
    amount: 50000,
    fees_paid: 0,
    created_at: Math.floor(Date.now() / 1000) - 3600,
    payment_hash: "abcd1234efgh5678",
    preimage: "preimage123",
  },
  {
    id: "tx2",
    type: "outgoing" as const,
    state: "settled" as const,
    description: "Payment sent",
    amount: 25000,
    fees_paid: 100,
    created_at: Math.floor(Date.now() / 1000) - 7200,
    payment_hash: "efgh5678ijkl9012",
    preimage: "preimage456",
  },
]);

export default function WalletServiceExample() {
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [supportedMethods, setSupportedMethods] = useState<string[]>([
    "get_balance",
    "get_info",
    "make_invoice",
    "pay_invoice",
    "list_transactions",
  ]);
  const [walletService, setWalletService] = useState<WalletService | null>(null);
  const [newRelay, setNewRelay] = useState<string>("");

  const balance = useObservableEagerState(balance$);
  const walletInfo = useObservableEagerState(walletInfo$);
  const transactions = useObservableEagerState(transactions$);

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: "incoming",
    state: "settled",
    description: "",
    amount: 0,
    fees_paid: 0,
  });

  // Create wallet service handlers
  const handlers = useMemo(() => {
    const handlers: WalletServiceHandlers = {};

    if (supportedMethods.includes("get_balance")) {
      handlers.get_balance = async () => ({ balance: balance$.value }); // Convert to msat
    }

    if (supportedMethods.includes("get_info")) {
      handlers.get_info = async () => ({
        ...walletInfo$.value,
        pubkey: await signer.getPublicKey(),
        methods: supportedMethods,
      });
    }

    if (supportedMethods.includes("list_transactions")) {
      handlers.list_transactions = async () => ({
        transactions: transactions$.value,
      });
    }

    if (supportedMethods.includes("make_invoice")) {
      handlers.make_invoice = async (params) => {
        const transaction: Transaction = {
          id: `tx${Date.now() + Math.round(Math.random() * 10000)}`,
          type: "incoming",
          state: "pending",
          invoice: "lnbc" + Math.random().toString(36).substring(7),
          description: params.description,
          description_hash: undefined,
          preimage: undefined,
          payment_hash: Math.random().toString(36).substring(7),
          amount: params.amount,
          fees_paid: 0,
          created_at: unixNow(),
          expires_at: unixNow() + 3600,
          metadata: {},
        };

        transactions$.next([transaction, ...transactions$.value]);
        return transaction;
      };
    }

    if (supportedMethods.includes("pay_invoice")) {
      handlers.pay_invoice = async (params) => {
        const parsed = parseBolt11(params.invoice);
        const amount = params.amount ?? parsed.amount;
        if (!amount) throw new Error("Missing amount");

        if (balance$.value < amount) throw new InsufficientBalanceError("Insufficient balance");

        const transaction: Transaction = {
          id: `tx${Date.now() + Math.round(Math.random() * 10000)}`,
          type: "outgoing",
          state: "settled",
          description: parsed.description,
          amount,
          fees_paid: Math.floor(Math.random() * 2000),
          created_at: unixNow(),
          expires_at: parsed.expiry,
          payment_hash: parsed.paymentHash,
        };

        transactions$.next([transaction, ...transactions$.value]);
        balance$.next(balance$.value - amount);

        return {
          preimage: Math.random().toString(36).substring(7),
          fees_paid: transaction.fees_paid,
        };
      };

      if (supportedMethods.includes("lookup_invoice")) {
        handlers.lookup_invoice = async (params) => {
          if (params.payment_hash) {
            const transaction = transactions$.value.find((tx) => tx.payment_hash === params.payment_hash);
            if (!transaction) throw new NotFoundError("Invoice with payment hash not found");
            return transaction;
          }

          if (params.invoice) {
            const transaction = transactions$.value.find((tx) => tx.invoice === params.invoice);
            if (!transaction) throw new NotFoundError("Invoice not found");
            return transaction;
          }

          throw new NotFoundError("Invoice not found");
        };
      }
    }

    return handlers;
  }, [supportedMethods, balance, signer, walletInfo, transactions]);

  const startWalletService = useCallback(async () => {
    try {
      const service = new WalletService<CommonWalletMethods>({
        relays,
        signer,
        handlers,
      });

      await service.start();
      setWalletService(service);
    } catch (error) {
      console.error("Failed to start wallet service:", error);
      alert("Failed to start wallet service: " + (error as Error).message);
    }
  }, [relays, signer, handlers]);

  const stopWalletService = useCallback(() => {
    if (walletService) {
      walletService.stop();
      setWalletService(null);
    }
  }, [walletService]);

  const addRelay = useCallback(() => {
    if (newRelay && !relays.includes(newRelay)) {
      setRelays((prev) => [...prev, newRelay]);
      setNewRelay("");
    }
  }, [newRelay, relays]);

  const removeRelay = useCallback((relay: string) => {
    setRelays((prev) => prev.filter((r) => r !== relay));
  }, []);

  const toggleMethod = useCallback((method: string) => {
    setSupportedMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]));
  }, []);

  // Transaction management helpers
  const addTransaction = useCallback(() => {
    if (newTransaction.description && newTransaction.amount) {
      const transaction: Transaction = {
        id: `tx${Date.now()}`,
        type: newTransaction.type as "incoming" | "outgoing",
        state: newTransaction.state as "pending" | "settled" | "failed",
        description: newTransaction.description,
        amount: Number(newTransaction.amount) * 1000,
        fees_paid: Number(newTransaction.fees_paid || 0) * 1000,
        created_at: unixNow(),
        payment_hash: Math.random().toString(36).substring(7),
        preimage: newTransaction.state === "settled" ? Math.random().toString(36).substring(7) : undefined,
      };
      transactions$.next([transaction, ...transactions$.value]);
      setNewTransaction({
        type: "incoming",
        state: "settled",
        description: "",
        amount: 0,
        fees_paid: 0,
      });
    }
  }, [newTransaction]);

  const removeTransaction = useCallback((id: string) => {
    transactions$.next(transactions$.value.filter((tx) => tx.id !== id));
  }, []);

  const settleTransaction = useCallback(
    async (id: string) => {
      const currentTransactions = transactions$.value;
      const transaction = currentTransactions.find((tx) => tx.id === id);

      if (!transaction || transaction.state !== "pending") {
        return;
      }

      // Update transaction state
      const updatedTransaction: Transaction = {
        ...transaction,
        state: "settled",
        settled_at: unixNow(),
        preimage: Math.random().toString(36).substring(7), // Generate a random preimage
      };

      // Update the transactions list
      transactions$.next(currentTransactions.map((tx) => (tx.id === id ? updatedTransaction : tx)));

      // Update the balance
      balance$.next(balance$.value + updatedTransaction.amount);

      // Send notification if wallet service is running
      if (walletService) {
        try {
          const notificationType = updatedTransaction.type === "incoming" ? "payment_received" : "payment_sent";
          // Send NIP-44 notification
          await walletService.notify(notificationType, updatedTransaction);
          // Send legacy notification
          await walletService.notify(notificationType, updatedTransaction, true);
          console.log(`Sent ${notificationType} notification for transaction ${id}`);
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    },
    [walletService],
  );

  const updateWalletInfo = useCallback((field: string, value: any) => {
    walletInfo$.next({ ...walletInfo$.value, [field]: value });
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto">
      {/* Header */}
      <header className="bg-base-100 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">NWC Wallet Service</h1>
            {walletService && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Service Running</span>
                </div>
                <button onClick={stopWalletService} className="btn btn-sm btn-error">
                  Stop Service
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!walletService ? (
        /* Setup View */
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Configure Your Wallet Service</h2>
              <p className="text-gray-600">Set up relays and supported methods before starting the service</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Relay Configuration */}
              <div className="bg-base-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Relay Configuration</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRelay}
                      onChange={(e) => setNewRelay(e.target.value)}
                      placeholder="wss://relay.example.com"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                      onClick={addRelay}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {relays.map((relay) => (
                      <div key={relay} className="flex justify-between items-center p-2 bg-base-200 rounded">
                        <span className="font-mono text-sm">{relay}</span>
                        <button onClick={() => removeRelay(relay)} className="btn btn-error btn-sm btn-ghost">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supported Methods Configuration */}
              <div className="bg-base-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Supported Methods</h3>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {AVAILABLE_METHODS.map((method) => (
                    <label key={method} className="flex items-center space-x-2 p-2 hover:bg-base-200 rounded">
                      <input
                        type="checkbox"
                        checked={supportedMethods.includes(method)}
                        onChange={() => toggleMethod(method)}
                        className="rounded"
                      />
                      <span className="text-sm font-mono">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={startWalletService} className="btn btn-success btn-lg">
                Start Wallet Service
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dashboard View */
        <div className="p-6 space-y-6">
          {/* Connection Info Bar */}
          {walletService.running && <ConnectionInfo connectionString={walletService.getConnectURI()} />}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Get Balance Card */}
            {supportedMethods.includes("get_balance") && (
              <BalanceCard balance={balance} setBalance={(v) => balance$.next(v)} />
            )}

            {/* Get Info Card */}
            {supportedMethods.includes("get_info") && (
              <WalletInfoCard walletInfo={walletInfo} updateWalletInfo={updateWalletInfo} />
            )}

            {/* List Transactions Card */}
            {supportedMethods.includes("list_transactions") && (
              <TransactionsCard
                transactions={transactions}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                addTransaction={addTransaction}
                removeTransaction={removeTransaction}
                settleTransaction={settleTransaction}
              />
            )}

            {/* Other method cards */}
            {supportedMethods.includes("make_invoice") && (
              <MethodCard
                method="make_invoice"
                color="bg-green-500"
                description="Invoice creation is handled automatically when requests are received."
                details="Returns random invoice data for testing."
              />
            )}

            {supportedMethods.includes("pay_invoice") && (
              <MethodCard
                method="pay_invoice"
                color="bg-red-500"
                description="Payments are simulated and will deduct from the balance above."
                details="Returns random payment data for testing."
              />
            )}

            {supportedMethods.includes("lookup_invoice") && (
              <MethodCard
                method="lookup_invoice"
                color="bg-purple-500"
                description="Lookup invoices by payment hash or invoice string."
                details="Returns transaction data for testing."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
