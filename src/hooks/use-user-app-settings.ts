import { useCallback, useMemo } from "react";
import { useActiveAccount, useStoreQuery } from "applesauce-react/hooks";
import { EventTemplate } from "nostr-tools";
import { ReadonlyAccount } from "applesauce-accounts/accounts";
import dayjs from "dayjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, defaultSettings } from "../helpers/app-settings";
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

export function useUserAppSettings(pubkey: string) {
  useReplaceableEvent({ kind: APP_SETTINGS_KIND, pubkey, identifier: APP_SETTING_IDENTIFIER });
  return useStoreQuery(AppSettingsQuery, [pubkey]);
}

export default function useAppSettings() {
  const account = useActiveAccount();
  const publish = usePublishEvent();

  // load synced settings
  useReplaceableEvent(
    account?.pubkey && { kind: APP_SETTINGS_KIND, pubkey: account.pubkey, identifier: APP_SETTING_IDENTIFIER },
  );

  const localSettings = account?.metadata?.settings;
  const syncedSettings = useStoreQuery(AppSettingsQuery, account && [account.pubkey]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!account) return;
      const updated: Partial<AppSettings> = { ...syncedSettings, ...newSettings };

      account.metadata = { ...account.metadata, settings: updated };

      if (!(account instanceof ReadonlyAccount)) {
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
