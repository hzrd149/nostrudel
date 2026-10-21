import { map } from "rxjs";
import { socialNotifications$ } from "./social";

export const replyNotifications$ = socialNotifications$.pipe(map((notifications) => notifications.replies));
