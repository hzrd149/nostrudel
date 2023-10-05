import { RelayMode } from "../classes/relay";
import Subject, { PersistentSubject } from "../classes/subject";
import SuperMap from "../classes/super-map";
import { unique } from "../helpers/array";
import accountService from "./account";
import clientRelaysService from "./client-relays";
import relayScoreboardService from "./relay-scoreboard";
import userContactsService, { UserContacts } from "./user-contacts";
import userRelaysService, { ParsedUserRelays } from "./user-relays";

type pubkey = string;
type relay = string;

class PubkeyRelayAssignmentService {
  pubkeys = new Map<pubkey, relay[]>();
  pubkeyRelays = new SuperMap<string, Subject<ParsedUserRelays>>(() => new Subject());
  assignments = new PersistentSubject<Record<pubkey, relay[]>>({});

  constructor() {
    let sub: Subject<UserContacts>;

    accountService.current.subscribe((account) => {
      if (sub) {
        sub.unsubscribe(this.handleUserContacts, this);
      }
      if (account) {
        this.pubkeys.clear();
        this.pubkeyRelays.clear();
        const contactsSub = userContactsService.requestContacts(account.pubkey, account.relays ?? []);
        contactsSub.subscribe(this.handleUserContacts, this);
        sub = contactsSub;
      }
    });
  }

  private handleUserContacts(contacts: UserContacts) {
    for (const pubkey of contacts.contacts) {
      const relay = contacts.contactRelay[pubkey];
      pubkeyRelayAssignmentService.addPubkey(pubkey, relay ? [relay] : []);
    }
  }

  addPubkey(pubkey: string, relays: string[] = []) {
    if (this.pubkeys.has(pubkey)) return;
    this.pubkeys.set(pubkey, relays);

    const readRelays = clientRelaysService.getReadUrls();
    const subject = userRelaysService.requestRelays(pubkey, unique([...readRelays, ...relays]));
    this.pubkeyRelays.set(pubkey, subject);
    // subject.subscribe(this.updateAssignments, this);
  }
  removePubkey(pubkey: string) {
    if (!this.pubkeys.has(pubkey)) return;

    this.pubkeys.delete(pubkey);
    this.pubkeyRelays.delete(pubkey);
  }

  updateAssignments() {
    const allRelays = new Set<relay>();

    for (const [pubkey, userRelays] of this.pubkeyRelays) {
      if (!userRelays.value) continue;
      for (const relayConfig of userRelays.value.relays) {
        // only use relays the users are writing to
        if (relayConfig.mode & RelayMode.WRITE) {
          allRelays.add(relayConfig.url);
        }
      }
    }

    const relayScores = new Map<relay, number>();
    for (const relay of allRelays) {
      relayScores.set(relay, relayScoreboardService.getRelayScore(relay));
    }

    const readRelays = clientRelaysService.getReadUrls();
    const assignments: Record<pubkey, relay[]> = {};
    for (const [pubkey] of this.pubkeys) {
      let userRelays =
        this.pubkeyRelays
          .get(pubkey)
          .value?.relays.filter((r) => r.mode & RelayMode.WRITE)
          .map((r) => r.url) ?? [];

      if (userRelays.length === 0) userRelays = Array.from(readRelays);

      const rankedOptions = Array.from(userRelays).sort(
        (a, b) => (relayScores.get(b) ?? 0) - (relayScores.get(a) ?? 0),
      );

      assignments[pubkey] = rankedOptions.slice(0, 3);

      for (const relay of assignments[pubkey]) {
        relayScores.set(relay, (relayScores.get(relay) ?? 0) + 1);
      }
    }

    this.assignments.next(assignments);
  }
}

const pubkeyRelayAssignmentService = new PubkeyRelayAssignmentService();

setInterval(() => {
  pubkeyRelayAssignmentService.updateAssignments();
}, 1000 * 5);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.pubkeyRelayAssignmentService = pubkeyRelayAssignmentService;
}

export default pubkeyRelayAssignmentService;
