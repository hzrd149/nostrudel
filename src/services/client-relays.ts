import accountService from "./account";
import { RelayMode } from "../classes/relay";
import userMailboxesService from "./user-mailboxes";
import { PersistentSubject } from "../classes/subject";
import { logger } from "../helpers/debug";
import RelaySet from "../classes/relay-set";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

class ClientRelayService {
  readRelays = new PersistentSubject(new RelaySet());
  writeRelays = new PersistentSubject(new RelaySet());

  log = logger.extend("ClientRelays");

  constructor() {
    const cachedRead = localStorage.getItem("read-relays")?.split(",");
    if (cachedRead) this.readRelays.next(RelaySet.from(cachedRead));

    const cachedWrite = localStorage.getItem("write-relays")?.split(",");
    if (cachedWrite) this.writeRelays.next(RelaySet.from(cachedWrite));
  }

  addRelay(url: string, mode: RelayMode) {
    if (mode & RelayMode.WRITE && !this.writeRelays.value.has(url))
      this.writeRelays.next(this.writeRelays.value.clone().add(url));

    if (mode & RelayMode.READ && !this.readRelays.value.has(url))
      this.readRelays.next(this.readRelays.value.clone().add(url));

    this.saveRelays();
  }
  removeRelay(url: string, mode: RelayMode) {
    if (mode & RelayMode.WRITE) {
      const next = this.writeRelays.value.clone();
      next.delete(url);
      this.writeRelays.next(next);
    }
    if (mode & RelayMode.READ) {
      const next = this.readRelays.value.clone();
      next.delete(url);
      this.readRelays.next(next);
    }

    this.saveRelays();
  }

  saveRelays() {
    localStorage.setItem("read-relays", this.readRelays.value.urls.join(","));
    localStorage.setItem("write-relays", this.writeRelays.value.urls.join(","));
  }

  get outbox() {
    const account = accountService.current.value;
    if (account) return userMailboxesService.getMailboxes(account.pubkey).value?.outbox ?? this.writeRelays.value;
    return this.writeRelays.value;
  }

  get inbox() {
    const account = accountService.current.value;
    if (account) return userMailboxesService.getMailboxes(account.pubkey).value?.inbox ?? this.readRelays.value;
    return this.readRelays.value;
  }
}

const clientRelaysService = new ClientRelayService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.clientRelaysService = clientRelaysService;
}

export default clientRelaysService;
