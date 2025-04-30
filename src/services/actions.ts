import { ActionHub } from "applesauce-actions";
import { kinds } from "nostr-tools";
import { getOutboxes } from "applesauce-core/helpers";

import { eventStore } from "./event-store";
import factory from "./event-factory";
import pool from "./pool";

const actions = new ActionHub(eventStore, factory, async (event) => {
  const mailboxes = eventStore.getReplaceable(kinds.RelayList, event.pubkey);
  const outboxes = mailboxes && getOutboxes(mailboxes);

  if (!outboxes) throw new Error("Failed to get outboxes");

  // publish the event
  eventStore.add(event);
  pool.publish(outboxes, event);
});

export default actions;
