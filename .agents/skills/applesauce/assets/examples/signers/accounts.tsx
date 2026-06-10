/**
 * Manage multiple Nostr accounts with different signers and switch between them
 * @tags signers, accounts, management
 * @related signers/password, signers/bunker
 */
import { AccountManager } from "applesauce-accounts";
import { registerCommonAccountTypes, PrivateKeyAccount } from "applesauce-accounts/accounts";
import { use$ } from "applesauce-react/hooks";
import { useCallback, useState } from "react";
import { merge, Subject } from "rxjs";

interface AccountMetadata {
  name: string;
}

// Initialize shared state at the top level
const manager = new AccountManager<AccountMetadata>();
registerCommonAccountTypes(manager);

// Load accounts from localStorage
const savedAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
await manager.fromJSON(savedAccounts);

// Restore active account if it exists
const activeAccountId = localStorage.getItem("activeAccount");
if (activeAccountId) {
  const account = manager.getAccount(activeAccountId);
  if (account) manager.setActive(account);
}

// Save accounts whenever they change
const manualSave = new Subject<void>();
merge(manualSave, manager.accounts$).subscribe(() => {
  localStorage.setItem("accounts", JSON.stringify(manager.toJSON()));
});

// Save active account whenever it changes
manager.active$.subscribe((account) => {
  if (account) localStorage.setItem("activeAccount", account.id);
  else localStorage.removeItem("activeAccount");
});

function AccountCard({ account }: { account: PrivateKeyAccount<AccountMetadata> }) {
  const activeAccount = use$(manager.active$);
  const [name, setName] = useState(account.metadata?.name || "");

  const saveName = useCallback(() => {
    manager.setAccountMetadata(account, { name });
    manualSave.next();
  }, [name, account]);

  const removeAccount = useCallback(() => {
    manager.removeAccount(account);
  }, [account]);

  const setActive = useCallback(() => {
    manager.setActive(account);
  }, [account]);

  return (
    <div className={`card bg-base-100 shadow-md ${activeAccount?.id === account.id ? "border-primary border-2" : ""}`}>
      <figure className="px-4 pt-4">
        <img
          src={`https://robohash.org/${account.pubkey}.png`}
          alt="Account avatar"
          className="rounded-full w-24 h-24"
        />
      </figure>
      <div className="card-body">
        <input
          type="text"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Account name"
          onBlur={saveName}
        />

        <p className="text-sm font-mono text-base-content/70">
          {account.pubkey.slice(0, 8)}...{account.pubkey.slice(-8)}
        </p>

        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={setActive} disabled={activeAccount?.id === account.id}>
            Set Active
          </button>
          <button className="btn btn-error" onClick={removeAccount}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountManagerExample() {
  const accounts = use$(manager.accounts$);

  const createNewAccount = useCallback(() => {
    const account = PrivateKeyAccount.generateNew<AccountMetadata>();
    account.metadata = { name: `Account ${accounts.length + 1}` };
    manager.addAccount(account);
  }, [accounts.length]);

  return (
    <div className="container mx-auto p-2 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Manager</h1>
        <button className="btn btn-primary" onClick={createNewAccount}>
          Create New Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account as PrivateKeyAccount<AccountMetadata>} />
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12 text-base-content/70">No accounts yet. Create one to get started!</div>
      )}
    </div>
  );
}
