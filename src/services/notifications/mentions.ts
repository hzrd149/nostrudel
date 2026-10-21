import { map } from "rxjs";
import { socialNotifications$ } from "./social";

export const mentionNotifications$ = socialNotifications$.pipe(map((notifications) => notifications.mentions));
