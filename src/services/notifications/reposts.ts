import { kinds } from "nostr-tools";
import { getRepostGroups } from "../../helpers/nostr/notification-groups";
import { createNotificationQuery } from "./common";

export type { TRepostGroup } from "../../helpers/nostr/notification-groups";
export const repostNotifications$ = createNotificationQuery(
  (user) => [{ kinds: [kinds.Repost, kinds.GenericRepost], "#p": [user] }],
  getRepostGroups,
  [],
);
