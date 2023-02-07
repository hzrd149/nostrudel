import { BehaviorSubject, distinctUntilKeyChanged } from "rxjs";
import { convertTimestampToDate } from "../helpers/date";
import { safeParse } from "../helpers/json";
import db from "./db";
import { Request } from "./request";

export type Contacts = {
  relays: Record<string, { read: boolean; write: boolean }>;
  contacts: {
    pubkey: string;
    relay?: string;
  }[];
  updated: Date;
};

export class UserContactsService {
  subjects = new Map<string, BehaviorSubject<Contacts | null>>();
  requests = new Map<string, Request>();

  private getSubject(pubkey: string) {
    if (!this.subjects.has(pubkey)) {
      const subject = new BehaviorSubject<Contacts | null>(null);
      this.subjects.set(pubkey, subject);
    }

    return this.subjects.get(pubkey) as BehaviorSubject<Contacts | null>;
  }

  requestUserContacts(pubkey: string, relays: string[]) {
    const subject = this.getSubject(pubkey);

    if (!subject.getValue()) {
      db.get("user-contacts", pubkey).then((contacts) => {
        if (contacts) {
          // reply with cache
          subject.next(contacts);
        } else {
          // there is no cache so request it from the relays
          if (!this.requests.has(pubkey)) {
            const request = new Request(relays);
            this.requests.set(pubkey, request);
            request.start({ authors: [pubkey], kinds: [3] });

            request.onEvent
              .pipe(
                // filter out duplicate events
                distinctUntilKeyChanged("id"),
                // filter out older events
                distinctUntilKeyChanged(
                  "created_at",
                  (prev, curr) => curr < prev
                )
              )
              .subscribe(async (event) => {
                const keys = event.tags
                  .filter((tag) => tag[0] === "p" && tag[1])
                  .map((tag) => ({ pubkey: tag[1] as string, relay: tag[2] }));

                const relays = safeParse(
                  event.content,
                  {}
                ) as Contacts["relays"];

                const contacts = {
                  relays,
                  contacts: keys,
                  updated: convertTimestampToDate(event.created_at),
                };

                db.put("user-contacts", contacts, event.pubkey);

                subject.next(contacts);
              });
          }
        }
      });
    }

    return subject;
  }
}

const userContacts = new UserContactsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userContacts = userContacts;
}

export default userContacts;
