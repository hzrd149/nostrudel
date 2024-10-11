import { Query } from "applesauce-core";

import { AppSettings, defaultSettings } from "../helpers/app-settings";
import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../services/user-app-settings";
import { safeJson } from "../helpers/parse";

export default function AppSettingsQuery(pubkey: string): Query<AppSettings> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(APP_SETTINGS_KIND, pubkey, APP_SETTING_IDENTIFIER).map((event) => {
        if (!event) return defaultSettings;
        const parsed = safeJson(event.content, defaultSettings) as Partial<AppSettings>;
        return { ...defaultSettings, ...parsed };
      }),
  };
}
