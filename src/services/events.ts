import { Subject } from "rxjs";
import { debounce } from "../helpers/function";
import { LinkedEvent } from "../helpers/thread";
import { NostrEvent } from "../types/nostr-event";
import db from "./db";
import { NostrRequest } from "../classes/nostr-request";
import { NostrSubscription } from "../classes/nostr-subscription";

function requestEvent(id: string, relays: string[], alwaysRequest = false) {
  const subject = new Subject<NostrEvent>();

  db.get("text-events", id).then((event) => {
    if (event) {
      subject.next(event);
      if (!alwaysRequest) return;
    }

    const request = new NostrRequest(relays);
    request.start({ ids: [id] });
    request.onEvent.subscribe((event) => {
      if (event) {
        subject.next(event);
        db.put("text-events", event);
      }
    });
  });

  return subject;
}

function loadThread(rootId: string, relays: string[], alwaysRequest = false) {
  const root = requestEvent(rootId, relays, alwaysRequest);
  const replies = new Subject<LinkedEvent>();
  const events = new Map<string, NostrEvent>();
  const sub = new NostrSubscription(relays, { "#e": [rootId], kinds: [1] });
  sub.open();

  const updateReplies = debounce(() => {
    // const linked = linkEvents([root, ...events], rootId);
    // replies.next(linked.get(rootId) as LinkedEvent);
  });

  sub.onEvent.subscribe((event) => {
    events.set(event.id, event);
  });

  return {
    event,
  };
}

const eventsService = {
  requestEvent,
};

export default eventsService;
