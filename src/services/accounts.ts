import { AccountManager, SerializedAccount } from "applesauce-accounts";
import { AmberClipboardAccount, PasswordAccount, registerCommonAccountTypes } from "applesauce-accounts/accounts";
import { NostrConnectSigner } from "applesauce-signers";
import { skip } from "rxjs";

import AndroidSignerAccount from "../classes/accounts/android-signer-account";
import { CAP_IS_NATIVE } from "../env";
import { nostrConnectPublish, nostrConnectSubscription } from "../helpers/applesauce";
import { logger } from "../helpers/debug";
import db from "./database";
import localSettings from "./preferences";

// Setup nostr connect signer
NostrConnectSigner.subscriptionMethod = nostrConnectSubscription;
NostrConnectSigner.publishMethod = nostrConnectPublish;

const log = logger.extend("Accounts");

const accounts = new AccountManager();
registerCommonAccountTypes(accounts);
accounts.registerType(AmberClipboardAccount);

// Setup password unlock prompt
PasswordAccount.requestUnlockPassword = async (account: PasswordAccount<any>) => {
  const password = window.prompt("Account unlock password");
  if (!password) throw new Error("Password required");
  return password;
};

// add android signer if native
if (CAP_IS_NATIVE) accounts.registerType(AndroidSignerAccount);

// TEMP: Migrate accounts from local storage to preferences
const legacyAccounts = (await db.getAll("accounts")) as SerializedAccount<any, any>[];
if (legacyAccounts.length) {
  log("Migrating accounts...");
  await localSettings.accounts.next(legacyAccounts);
  await db.clear("accounts");
  log("Migrated", legacyAccounts.length, "accounts to preferences");
}

// load all accounts
log("Loading accounts...");
accounts.fromJSON(localSettings.accounts.value, true);

// save accounts to database when they change
accounts.accounts$.pipe(skip(1)).subscribe(async () => {
  const json = accounts.toJSON();
  await localSettings.accounts.next(json);
});

// load last active account
const lastPubkey = localSettings.activeAccount.value;
const lastAccount = lastPubkey && accounts.getAccountForPubkey(lastPubkey);
if (lastAccount) accounts.setActive(lastAccount);

// save last active
accounts.active$.pipe(skip(1)).subscribe((account) => {
  if (localSettings.activeAccount.value === (account?.id ?? null)) return;

  if (account) localSettings.activeAccount.next(account.pubkey);
  else localSettings.activeAccount.clear();
});

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.accounts = accounts;
}

export default accounts;
