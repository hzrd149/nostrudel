import { Model } from "applesauce-core";
import { safeParse } from "applesauce-core/helpers/json";
import { map } from "rxjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND, AppSettings, DEFAULT_APP_SETTINGS } from "../helpers/app-settings";
import { ReplaceableQuery } from "./addressable";
import { ProfilePointer } from "nostr-tools/nip19";

export function AppSettingsQuery(pubkey: string | ProfilePointer): Model<AppSettings> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;

  return (events) =>
    events.model(ReplaceableQuery, APP_SETTINGS_KIND, pointer.pubkey, APP_SETTING_IDENTIFIER, pointer.relays).pipe(
      map((event) => {
        if (!event) return DEFAULT_APP_SETTINGS;
        const parsed = safeParse<Partial<AppSettings>>(event.content);
        return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }),
    );
}
