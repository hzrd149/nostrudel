import { map } from "rxjs";
import { socialNotifications$ } from "./social";

export {
  getReplyPointer,
  getThreadRoot,
  getThreadRootKey,
  type ThreadGroupData,
} from "../../helpers/nostr/notifications";
export const threadNotifications$ = socialNotifications$.pipe(map((notifications) => notifications.threads));
