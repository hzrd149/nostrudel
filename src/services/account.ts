import { Account } from "../classes/accounts/account";
import AmberAccount from "../classes/accounts/amber-account";
import ExtensionAccount from "../classes/accounts/extension-account";
import NostrConnectAccount from "../classes/accounts/nostr-connect-account";
import NsecAccount from "../classes/accounts/nsec-account";
import PasswordAccount from "../classes/accounts/password-account";
import PubkeyAccount from "../classes/accounts/pubkey-account";
import SerialPortAccount from "../classes/accounts/serial-port-account";
import { PersistentSubject } from "../classes/subject";
import { logger } from "../helpers/debug";
import db from "./db";
import { AppSettings } from "../helpers/app-settings";

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

class AccountService {
  log = logger.extend("AccountService");
  loading = new PersistentSubject(true);
  accounts = new PersistentSubject<Account[]>([]);
  current = new PersistentSubject<Account | null>(null);
  isGhost = new PersistentSubject(false);

  constructor() {
    db.getAll("accounts").then((accountData) => {
      const accounts: Account[] = [];

      for (const data of accountData) {
        try {
          const account = this.createAccountFromDatabaseRecord(data);
          if (account) accounts.push(account);
        } catch (error) {
          this.log("Failed to load account", data, error);
        }
      }

      this.accounts.next(accounts);

      const lastAccount = localStorage.getItem("lastAccount");
      if (lastAccount && this.hasAccount(lastAccount)) {
        this.switchAccount(lastAccount);
      } else localStorage.removeItem("lastAccount");

      this.loading.next(false);
    });
  }

  private createAccountFromDatabaseRecord(data: { type: string; pubkey: string }) {
    switch (data.type) {
      case "local":
        return new PasswordAccount(data.pubkey).fromJSON(data);
      case "nsec":
        return new NsecAccount(data.pubkey).fromJSON(data);
      case "pubkey":
        return new PubkeyAccount(data.pubkey).fromJSON(data);
      case "extension":
        return new ExtensionAccount(data.pubkey).fromJSON(data);
      case "amber":
        return new AmberAccount(data.pubkey).fromJSON(data);
      case "serial":
        return new SerialPortAccount(data.pubkey).fromJSON(data);
      case "nostr-connect":
        return new NostrConnectAccount(data.pubkey).fromJSON(data);
    }
  }

  startGhost(pubkey: string) {
    const ghostAccount = new PubkeyAccount(pubkey);

    const lastPubkey = this.current.value?.pubkey;
    if (lastPubkey && this.hasAccount(lastPubkey)) localStorage.setItem("lastAccount", lastPubkey);
    this.current.next(ghostAccount);
    this.isGhost.next(true);
  }
  stopGhost() {
    const lastAccount = localStorage.getItem("lastAccount");
    if (lastAccount && this.hasAccount(lastAccount)) {
      this.switchAccount(lastAccount);
    } else this.logout();
  }

  hasAccount(pubkey: string) {
    return this.accounts.value.some((account) => account.pubkey === pubkey);
  }
  addAccount(account: Account) {
    if (this.hasAccount(account.pubkey)) {
      // replace account
      this.accounts.next(this.accounts.value.map((acc) => (acc.pubkey === account.pubkey ? account : acc)));

      // if this is the current account. update it
      if (this.current.value?.pubkey === account.pubkey) {
        this.current.next(account);
        this.isGhost.next(false);
      }
    } else {
      // add account
      this.accounts.next(this.accounts.value.concat(account));
    }

    db.put("accounts", account.toJSON());
  }
  removeAccount(account: Account | string) {
    const pubkey = account instanceof Account ? account.pubkey : account;
    this.accounts.next(this.accounts.value.filter((acc) => acc.pubkey !== pubkey));

    db.delete("accounts", pubkey);
  }

  saveAccount(account: Account) {
    return db.put("accounts", account.toJSON());
  }

  updateAccountLocalSettings(pubkey: string, settings: Partial<AppSettings>) {
    const account = this.accounts.value.find((acc) => acc.pubkey === pubkey);
    if (account) account.localSettings = settings;
  }

  switchAccount(account: Account | string) {
    const newCurrent =
      typeof account === "string" ? this.accounts.value.find((acc) => acc.pubkey === account) : account;

    if (newCurrent) {
      this.current.next(newCurrent);
      this.isGhost.next(false);
      localStorage.setItem("lastAccount", newCurrent.pubkey);
    }
  }

  replaceAccount(oldPubkey: string, newAccount: Account, change = true) {
    const account = this.accounts.value.find((acc) => acc.pubkey === oldPubkey);

    if (account) {
      this.current.next(newAccount);
      this.accounts.next([...this.accounts.value.filter((acc) => acc !== account), newAccount]);
      this.isGhost.next(false);
      localStorage.setItem("lastAccount", newAccount.pubkey);
    }
  }

  logout(clear = true) {
    if (clear && this.current.value) {
      this.removeAccount(this.current.value.pubkey);
    }

    this.current.next(null);
    this.isGhost.next(false);
    localStorage.removeItem("lastAccount");
  }
}

const accountService = new AccountService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.accountService = accountService;
}

// temporary fix for converting old sublt crypto accounts to ncryptsec
setInterval(() => {
  for (const account of accountService.accounts.value) {
    if (account instanceof PasswordAccount && account.signer.ncryptsec && account.signer.buffer) {
      accountService.saveAccount(account);
    }
  }
}, 10_000);

export default accountService;
