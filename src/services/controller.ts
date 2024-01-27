import accountService from "./account";
import clientRelaysService from "./client-relays";
import userAppSettings from "./settings/user-app-settings";
import userMailboxesService from "./user-mailboxes";

accountService.current.subscribe((account) => {
  if (!account) return;
  const relays = clientRelaysService.readRelays.value;
  userMailboxesService.requestMailboxes(account.pubkey, relays, { alwaysRequest: true });
  userAppSettings.requestAppSettings(account.pubkey, relays, { alwaysRequest: true });
});
