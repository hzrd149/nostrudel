import { Query } from "applesauce-core";
import { map } from "rxjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, defaultSettings } from "../helpers/app-settings";
import { safeJson } from "../helpers/parse";

export default function AppSettingsQuery(pubkey: string): Query<AppSettings> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(APP_SETTINGS_KIND, pubkey, APP_SETTING_IDENTIFIER).pipe(
        map((event) => {
          if (!event) return defaultSettings;
          const parsed = safeJson<Partial<AppSettings>>(event.content, defaultSettings);
          return { ...defaultSettings, ...parsed };
        }),
      ),
  };
}
