import { AccountManager } from "applesauce-accounts";
import { registerCommonAccountTypes } from "applesauce-accounts/accounts";

import db from "./db";
import { AppSettings } from "../helpers/app-settings";
import { CAP_IS_NATIVE } from "../env";
import { logger } from "../helpers/debug";
import AndroidSignerAccount from "../classes/accounts/android-signer-account";

type CommonAccount = {
  pubkey: string;
  relays?: string[];
  localSettings?: AppSettings;
};
export type LocalAccount = CommonAccount & {
  type: "local";
  readonly: false;
  secKey: ArrayBuffer;
  iv: Uint8Array;
};

const log = logger.extend("Accounts");

const accounts = new AccountManager();
registerCommonAccountTypes(accounts);

// add android signer if native
if (CAP_IS_NATIVE) accounts.registerType(AndroidSignerAccount);

// load all accounts
log("Loading accounts...");
accounts.fromJSON(await db.getAll("accounts"), true);

// save accounts to database when they change
accounts.accounts$.subscribe(async () => {
  const json = accounts.toJSON();
  for (const account of json) await db.put("accounts", account);

  // remove old accounts
  const existing = await db.getAll("accounts");
  for (const { id } of existing) {
    if (!accounts.getAccount(id)) await db.delete("accounts", id);
  }
});

// load last active account
const lastPubkey = localStorage.getItem("active-account");
const lastAccount = lastPubkey && accounts.getAccountForPubkey(lastPubkey);
if (lastAccount) accounts.setActive(lastAccount);

// save last active to localstorage
accounts.active$.subscribe((account) => {
  if (account) localStorage.setItem("active-account", account.pubkey);
});

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.accounts = accounts;
}

export default accounts;
