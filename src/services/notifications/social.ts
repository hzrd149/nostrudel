import {
  getSocialNotifications,
  SocialNotifications,
  SOCIAL_NOTIFICATION_KINDS,
} from "../../helpers/nostr/notifications";
import { createNotificationQuery } from "./common";

export const socialNotifications$ = createNotificationQuery<SocialNotifications>(
  (user) => [{ kinds: SOCIAL_NOTIFICATION_KINDS, "#p": [user] }, { authors: [user] }],
  getSocialNotifications,
  { replies: [], mentions: [], quotes: [], threads: [] },
);
