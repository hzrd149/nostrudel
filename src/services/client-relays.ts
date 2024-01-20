import accountService from "./account";
import { RelayMode } from "../classes/relay";
import userMailboxesService, { UserMailboxes } from "./user-mailboxes";
import { PersistentSubject, Subject } from "../classes/subject";
import { logger } from "../helpers/debug";
import appSettings from "./settings/app-settings";
import RelaySet from "../classes/relay-set";
import { safeUrl } from "../helpers/parse";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

// const userRelaysToRelayConfig: Connection<ParsedUserRelays, RelayConfig[], RelayConfig[] | undefined> = (
//   userRelays,
//   next,
// ) => next(userRelays.relays);

class ClientRelayService {
  readRelays = new PersistentSubject(new RelaySet());
  writeRelays = new PersistentSubject(new RelaySet());
  // outbox = new PersistentSubject(new RelaySet());
  // inbox = new PersistentSubject(new RelaySet());

  log = logger.extend("ClientRelays");

  constructor() {
    accountService.loading.subscribe(this.handleAccountChange, this);
    accountService.current.subscribe(this.handleAccountChange, this);

    appSettings.subscribe(this.handleSettingsChange, this);

    // set the read and write relays
    // this.relays.subscribe((relays) => {
    //   this.log("Got new relay list", relays);
    //   this.outbox.next(relays.filter((r) => r.mode & RelayMode.WRITE));
    //   this.inbox.next(relays.filter((r) => r.mode & RelayMode.READ));
    // });
  }

  addRelay(url: string, mode: RelayMode) {
    if (mode & RelayMode.WRITE) this.writeRelays.next(this.writeRelays.value.clone().add(url));
    if (mode & RelayMode.READ) this.readRelays.next(this.readRelays.value.clone().add(url));
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
  }

  private handleSettingsChange() {
    this.readRelays.next(RelaySet.from(appSettings.value.defaultRelays));
    this.writeRelays.next(new RelaySet());
  }

  private userRelaySub: Subject<UserMailboxes> | undefined;
  private handleAccountChange() {
    // skip if account is loading
    if (accountService.loading.value) return;

    // disconnect the relay list subject
    // if (this.userRelaySub) {
    // this.relays.disconnect(this.userRelaySub);
    // this.userRelaySub.unsubscribe(this.handleUserRelays, this);
    // this.userRelaySub = undefined;
    // }

    const account = accountService.current.value;
    if (!account) return;

    // connect the relay subject with the account relay subject
    // this.userRelaySub = userMailboxesService.requestMailboxes(account.pubkey, [COMMON_CONTACT_RELAY]);
    // this.userRelaySub.subscribe(this.handleUserRelays, this);
    // this.relays.connectWithHandler(this.userRelaySub, userRelaysToRelayConfig);

    // load the relays from cache
    // if (!userRelaysService.getRelays(account.pubkey).value) {
    //   this.log("Load users relay list from cache");
    //   userRelaysService.loadFromCache(account.pubkey).then(() => {
    //     if (this.relays.value.length === 0) {
    //       const bootstrapRelays = account.relays ?? [COMMON_CONTACT_RELAY];

    //       this.log("Loading relay list from bootstrap relays", bootstrapRelays);
    //       userRelaysService.requestRelays(account.pubkey, bootstrapRelays, { alwaysRequest: true });
    //     }
    //   });
    // }

    // double check for new relay notes
    // setTimeout(() => {
    //   if (this.relays.value.length === 0) return;

    //   this.log("Requesting latest relay list from relays");
    //   userRelaysService.requestRelays(account.pubkey, this.getOutboxURLs(), { alwaysRequest: true });
    // }, 5000);
  }

  // private handleUserRelays(userRelays: UserMailboxes) {
  //   if (userRelays.pubkey === accountService.current.value?.pubkey) {
  //     this.inbox.next(userRelays.mailboxes.filter(RelayMode.READ));
  //     this.outbox.next(userRelays.mailboxes.filter(RelayMode.WRITE));
  //   }
  // }

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
