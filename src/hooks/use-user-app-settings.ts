import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { EventTemplate } from "nostr-tools";
import { useCallback, useMemo } from "react";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, DEFAULT_APP_SETTINGS } from "../helpers/app-settings";
import { AppSettingsQuery } from "../models";
import { usePublishEvent } from "../providers/global/publish-provider";
import useReplaceableEvent from "./use-replaceable-event";
import { ProfilePointer } from "nostr-tools/nip19";

function buildAppSettingsEvent(settings: Partial<AppSettings>): EventTemplate {
  return {
    kind: APP_SETTINGS_KIND,
    tags: [["d", APP_SETTING_IDENTIFIER]],
    content: JSON.stringify(settings),
    created_at: dayjs().unix(),
  };
}

export function useUserAppSettings(pubkey?: string | ProfilePointer) {
  return useEventModel(AppSettingsQuery, pubkey ? [pubkey] : undefined) ?? DEFAULT_APP_SETTINGS;
}

export default function useAppSettings() {
  const account = useActiveAccount();
  const publish = usePublishEvent();

  // load synced settings
  useReplaceableEvent(
    account?.pubkey && { kind: APP_SETTINGS_KIND, pubkey: account.pubkey, identifier: APP_SETTING_IDENTIFIER },
  );

  const localSettings = account?.metadata?.settings;
  const syncedSettings = useEventModel(AppSettingsQuery, account && [account.pubkey]);

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
    () => ({ ...DEFAULT_APP_SETTINGS, ...localSettings, ...syncedSettings }),
    [localSettings, syncedSettings],
  );

  return {
    ...settings,
    updateSettings,
  };
}
