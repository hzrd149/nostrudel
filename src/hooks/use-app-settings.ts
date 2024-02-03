import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";

import appSettings from "../services/settings/app-settings";
import useSubject from "./use-subject";
import { AppSettings } from "../services/settings/migrations";
import useCurrentAccount from "./use-current-account";
import accountService from "../services/account";
import userAppSettings from "../services/settings/user-app-settings";
import { usePublishEvent } from "../providers/global/publish-provider";

export default function useAppSettings() {
  const account = useCurrentAccount();
  const settings = useSubject(appSettings);
  const publish = usePublishEvent();

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!account) return;
      const full: AppSettings = { ...settings, ...newSettings };

      if (account.readonly) {
        accountService.updateAccountLocalSettings(account.pubkey, full);
        appSettings.next(full);
      } else {
        const draft = userAppSettings.buildAppSettingsEvent(full);
        await publish("Update Settings", draft);
      }
    },
    [settings, account, publish],
  );

  return {
    ...settings,
    updateSettings,
  };
}
