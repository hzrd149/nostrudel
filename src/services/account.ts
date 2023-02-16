import { PersistentSubject } from "../classes/subject";
import db from "./db";

export type Account = {
  pubkey: string;
  readonly?: boolean;
  relays?: string[];
  secKey?: string;
  useExtension?: boolean;
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
