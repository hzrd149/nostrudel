import { PersistentSubject } from "../classes/subject";
import accountService from "./account";
import userAppSettings, { AppSettings, defaultSettings } from "./user-app-settings";
import clientRelaysService from "./client-relays";
import signingService from "./signing";
import { nostrPostAction } from "../classes/nostr-post-action";

export let appSettings = new PersistentSubject(defaultSettings);
export async function replaceSettings(newSettings: AppSettings) {
  const account = accountService.current.value;
  if (!account) return;

  if (account.readonly) {
    accountService.updateAccountLocalSettings(account.pubkey, newSettings);
    appSettings.next(newSettings);
  } else {
    const draft = userAppSettings.buildAppSettingsEvent(newSettings);
    const event = await signingService.requestSignature(draft, account);
    userAppSettings.receiveEvent(event);
    await nostrPostAction(clientRelaysService.getWriteUrls(), event).onComplete;
  }
}

export async function loadSettings() {
  const account = accountService.current.value;
  if (!account) {
    appSettings.next(defaultSettings);
    return;
  }

  appSettings.disconnectAll();

  if (account.readonly) {
    if (account.localSettings) {
      appSettings.next(account.localSettings);
    }
  } else {
    const subject = userAppSettings.requestAppSettings(account.pubkey, clientRelaysService.getReadUrls());
    appSettings.connect(subject);
  }
}
accountService.current.subscribe(loadSettings);
clientRelaysService.relays.subscribe(loadSettings);

export default appSettings;
