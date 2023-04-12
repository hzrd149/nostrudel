import Subject from "../classes/subject";
import userContactsService from "./user-contacts";
import userRelaysService, { UserRelays } from "./user-relays";

class UserRelaysFallbackService {
  subjects = new Map<string, Subject<UserRelays>>();

  requestRelays(pubkey: string, relays: string[], alwaysFetch = false) {
    let subject = this.subjects.get(pubkey);
    if (!subject) {
      subject = new Subject();
      this.subjects.set(pubkey, subject);

      subject.connectWithHandler(userRelaysService.getSubject(pubkey), (userRelays, next, value) => {
        if (!value || userRelays.created_at > value.created_at) {
          next(userRelays);
        }
      });
      subject.connectWithHandler(userContactsService.getSubject(pubkey), (contacts, next, value) => {
        if (contacts.relays.length > 0 && (!value || contacts.created_at > value.created_at)) {
          next({ pubkey: contacts.pubkey, relays: contacts.relays, created_at: contacts.created_at });
        }
      });
    }

    userRelaysService.requestRelays(pubkey, relays, alwaysFetch);
    userContactsService.requestContacts(pubkey, relays, alwaysFetch);

    return subject;
  }
}

const userRelaysFallbackService = new UserRelaysFallbackService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userRelaysFallbackService = userRelaysFallbackService;
}

export default userRelaysFallbackService;
