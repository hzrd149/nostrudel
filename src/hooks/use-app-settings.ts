import { useCallback, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { EventTemplate } from "nostr-tools";
import dayjs from "dayjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, defaultSettings } from "../helpers/app-settings";
import useCurrentAccount from "./use-current-account";
import accountService from "../services/account";
import { usePublishEvent } from "../providers/global/publish-provider";
import AppSettingsQuery from "../queries/app-settings";
import useReplaceableEvent from "./use-replaceable-event";

function buildAppSettingsEvent(settings: Partial<AppSettings>): EventTemplate {
  return {
    kind: APP_SETTINGS_KIND,
    tags: [["d", APP_SETTING_IDENTIFIER]],
    content: JSON.stringify(settings),
    created_at: dayjs().unix(),
  };
}

export default function useAppSettings() {
  const account = useCurrentAccount();
  const publish = usePublishEvent();

  // load synced settings
  useReplaceableEvent(account?.pubkey && { kind: APP_SETTINGS_KIND, pubkey: account.pubkey });

  const localSettings = account?.localSettings;
  const syncedSettings = useStoreQuery(AppSettingsQuery, account && [account.pubkey]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!account) return;
      const updated: Partial<AppSettings> = { ...syncedSettings, ...newSettings };

      accountService.updateAccountLocalSettings(account.pubkey, updated);
      if (!account.readonly) {
        const draft = buildAppSettingsEvent(updated);
        await publish("Update Settings", draft);
      }
    },
    [syncedSettings, account, publish],
  );

  const settings: AppSettings = useMemo(
    () => ({ ...defaultSettings, ...localSettings, ...syncedSettings }),
    [localSettings, syncedSettings],
  );

  return {
    ...settings,
    updateSettings,
  };
}
