import { map } from "rxjs";
import { socialNotifications$ } from "./social";

export const quoteNotifications$ = socialNotifications$.pipe(map((notifications) => notifications.quotes));
