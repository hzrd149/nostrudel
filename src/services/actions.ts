import { ActionHub } from "applesauce-actions";
import { kinds } from "nostr-tools";
import { getOutboxes } from "applesauce-core/helpers";

import { eventStore } from "./event-store";
import factory from "./event-factory";
import rxNostr from "./rx-nostr";

const actions = new ActionHub(eventStore, factory, async (label, event) => {
  const mailboxes = eventStore.getReplaceable(kinds.RelayList, event.pubkey);
  const outboxes = mailboxes && getOutboxes(mailboxes);

  // publish the event
  eventStore.add(event);
  rxNostr.send(event, { on: { relays: outboxes } });
});

export default actions;
