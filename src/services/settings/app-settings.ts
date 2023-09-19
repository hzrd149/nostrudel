import { PersistentSubject } from "../../classes/subject";
import accountService from "../account";
import userAppSettings from "./user-app-settings";
import clientRelaysService from "../client-relays";
import signingService from "../signing";
import { AppSettings, defaultSettings } from "./migrations";
import { logger } from "../../helpers/debug";
import NostrPublishAction from "../../classes/nostr-publish-action";

const log = logger.extend("AppSettings");

export let appSettings = new PersistentSubject(defaultSettings);
appSettings.subscribe((event) => {
  log(`Changed`, event);
});

export async function replaceSettings(newSettings: AppSettings) {
  const account = accountService.current.value;
  if (!account) return;

  if (account.readonly) {
    accountService.updateAccountLocalSettings(account.pubkey, newSettings);
    appSettings.next(newSettings);
  } else {
    const draft = userAppSettings.buildAppSettingsEvent(newSettings);
    const signed = await signingService.requestSignature(draft, account);
    userAppSettings.receiveEvent(signed);
    const pub = new NostrPublishAction("Update Settings", clientRelaysService.getWriteUrls(), signed);
  }
}

accountService.current.subscribe(() => {
  const account = accountService.current.value;

  if (!account) {
    appSettings.next(defaultSettings);
    return;
  }

  appSettings.disconnectAll();

  if (account.localSettings) {
    appSettings.next(account.localSettings);
    log("Loaded user settings from local storage");
  }

  const subject = userAppSettings.requestAppSettings(account.pubkey, clientRelaysService.getReadUrls(), true);
  appSettings.next(defaultSettings);
  appSettings.connect(subject);
});

clientRelaysService.relays.subscribe(() => {
  // relays changed, look for settings again
  const account = accountService.current.value;

  if (account) {
    userAppSettings.requestAppSettings(account.pubkey, clientRelaysService.getReadUrls(), true);
  }
});

export default appSettings;
