import { Query } from "applesauce-core";
import { safeParse } from "applesauce-core/helpers/json";
import { map } from "rxjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, defaultSettings } from "../helpers/app-settings";

export default function AppSettingsQuery(pubkey: string): Query<AppSettings> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(APP_SETTINGS_KIND, pubkey, APP_SETTING_IDENTIFIER).pipe(
        map((event) => {
          if (!event) return defaultSettings;
          const parsed = safeParse<Partial<AppSettings>>(event.content);
          return { ...defaultSettings, ...parsed };
        }),
      ),
  };
}
