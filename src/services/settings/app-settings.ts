import { PersistentSubject } from "../../classes/subject";
import accountService from "../account";
import userAppSettings from "./user-app-settings";
import clientRelaysService from "../client-relays";
import { defaultSettings } from "./migrations";
import { logger } from "../../helpers/debug";

const log = logger.extend("AppSettings");

export let appSettings = new PersistentSubject(defaultSettings);
appSettings.subscribe((event) => {
  log(`Changed`, event);
});

let accountSub: ZenObservable.Subscription;
accountService.current.subscribe(() => {
  const account = accountService.current.value;

  if (!account) {
    appSettings.next(defaultSettings);
    return;
  }

  if (accountSub) accountSub.unsubscribe();

  if (account.localSettings) {
    appSettings.next(account.localSettings);
    log("Loaded user settings from local storage");
  }

  const subject = userAppSettings.requestAppSettings(account.pubkey, clientRelaysService.readRelays.value, {
    alwaysRequest: true,
  });
  appSettings.next(subject.value || defaultSettings);
  accountSub = subject.subscribe((s) => appSettings.next(s));
});

// clientRelaysService.relays.subscribe(() => {
//   // relays changed, look for settings again
//   const account = accountService.current.value;

//   if (account) {
//     userAppSettings.requestAppSettings(account.pubkey, clientRelaysService.getInboxURLs(), { alwaysRequest: true });
//   }
// });

export default appSettings;
