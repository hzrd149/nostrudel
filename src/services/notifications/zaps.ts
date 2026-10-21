import { kinds } from "nostr-tools";
import { getZapGroups } from "../../helpers/nostr/notification-groups";
import { createNotificationQuery } from "./common";

export const zapNotifications$ = createNotificationQuery(
  (user) => [{ kinds: [kinds.Zap], "#p": [user] }],
  getZapGroups,
  [],
);
