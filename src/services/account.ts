import { PersistentSubject } from "../classes/subject";
import db from "./db";
import { AppSettings } from "./settings/migrations";

export type Account = {
  pubkey: string;
  readonly: boolean;
  relays?: string[];
  secKey?: ArrayBuffer;
  iv?: Uint8Array;
  useExtension?: boolean;
  localSettings?: AppSettings;
};

class AccountService {
  loading = new PersistentSubject(true);
  accounts = new PersistentSubject<Account[]>([]);
  current = new PersistentSubject<Account | null>(null);

  constructor() {
    db.getAll("accounts").then((accounts) => {
      this.accounts.next(accounts);

      const lastAccount = localStorage.getItem("lastAccount");
      if (lastAccount && this.hasAccount(lastAccount)) {
        this.switchAccount(lastAccount);
      }

      this.loading.next(false);
    });
  }

  hasAccount(pubkey: string) {
    return this.accounts.value.some((acc) => acc.pubkey === pubkey);
  }
  addAccount(account: Account) {
    if (this.hasAccount(account.pubkey)) {
      // replace account
      this.accounts.next(this.accounts.value.map((acc) => (acc.pubkey === account.pubkey ? account : acc)));

      // if this is the current account. update it
      if (this.current.value?.pubkey === account.pubkey) {
        this.current.next(account);
      }
    } else {
      // add account
      this.accounts.next(this.accounts.value.concat(account));
    }

    db.put("accounts", account);
  }
  removeAccount(pubkey: string) {
    this.accounts.next(this.accounts.value.filter((acc) => acc.pubkey !== pubkey));

    db.delete("accounts", pubkey);
  }

  updateAccountLocalSettings(pubkey: string, settings: AppSettings) {
    const account = this.accounts.value.find((acc) => acc.pubkey === pubkey);
    if (account) {
      const updated = { ...account, localSettings: settings };

      // update account
      this.addAccount(updated);
    }
  }

  switchAccount(pubkey: string) {
    const account = this.accounts.value.find((acc) => acc.pubkey === pubkey);
    if (account) {
      this.current.next(account);
      localStorage.setItem("lastAccount", pubkey);
    }
  }
  switchToTemporary(account: Account) {
    this.current.next(account);
  }

  logout() {
    this.current.next(null);
    localStorage.removeItem("lastAccount");
  }
}

const accountService = new AccountService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.identity = accountService;
}

export default accountService;
