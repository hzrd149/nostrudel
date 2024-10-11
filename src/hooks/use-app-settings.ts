import { useCallback, useEffect } from "react";

import { AppSettings, defaultSettings } from "../helpers/app-settings";
import useCurrentAccount from "./use-current-account";
import accountService from "../services/account";
import userAppSettings from "../services/user-app-settings";
import { usePublishEvent } from "../providers/global/publish-provider";
import { useStoreQuery } from "applesauce-react";
import AppSettingsQuery from "../queries/app-settings";
import { useReadRelays } from "./use-client-relays";

export default function useAppSettings() {
  const account = useCurrentAccount();
  const publish = usePublishEvent();

  const localSettings = account?.localSettings;
  const syncedSettings = useStoreQuery(AppSettingsQuery, account && [account.pubkey]);

  const readRelays = useReadRelays();
  useEffect(() => {
    if (account?.pubkey) userAppSettings.requestAppSettings(account.pubkey, readRelays);
  }, [account?.pubkey, readRelays]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!account) return;
      const updated: Partial<AppSettings> = { ...syncedSettings, ...newSettings };

      accountService.updateAccountLocalSettings(account.pubkey, updated);
      if (!account.readonly) {
        const draft = userAppSettings.buildAppSettingsEvent(updated);
        await publish("Update Settings", draft);
      }
    },
    [syncedSettings, account, publish],
  );

  const settings: AppSettings = { ...defaultSettings, ...localSettings, ...syncedSettings };

  return {
    ...settings,
    updateSettings,
  };
}
