import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";

import appSettings, { replaceSettings } from "../services/settings/app-settings";
import useSubject from "./use-subject";
import { AppSettings } from "../services/settings/migrations";
import useCurrentAccount from "./use-current-account";
import accountService from "../services/account";
import userAppSettings from "../services/settings/user-app-settings";
import { useSigningContext } from "../providers/global/signing-provider";
import NostrPublishAction from "../classes/nostr-publish-action";
import clientRelaysService from "../services/client-relays";

export default function useAppSettings() {
  const account = useCurrentAccount();
  const settings = useSubject(appSettings);
  const { requestSignature } = useSigningContext();
  const toast = useToast();

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      try {
        if (!account) return;
        const full: AppSettings = { ...settings, ...newSettings };

        if (account.readonly) {
          accountService.updateAccountLocalSettings(account.pubkey, full);
          appSettings.next(full);
        } else {
          const draft = userAppSettings.buildAppSettingsEvent(full);
          const signed = await requestSignature(draft);
          userAppSettings.receiveEvent(signed);
          new NostrPublishAction("Update Settings", clientRelaysService.outbox.urls, signed);
        }
        return replaceSettings({ ...settings, ...newSettings });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [settings, account, requestSignature],
  );

  return {
    ...settings,
    updateSettings,
  };
}
