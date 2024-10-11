import dayjs from "dayjs";

import { DraftNostrEvent } from "../types/nostr-event";

import SuperMap from "../classes/super-map";
import { AppSettings } from "../helpers/app-settings";
import replaceableEventsService, { RequestOptions } from "./replaceable-events";
import { queryStore } from "./event-store";
import Observable from "zen-observable";
import AppSettingsQuery from "../queries/app-settings";

export const APP_SETTINGS_KIND = 30078;
export const APP_SETTING_IDENTIFIER = "nostrudel-settings";

class UserAppSettings {
  private parsed = new SuperMap<string, Observable<AppSettings>>((pubkey) =>
    queryStore.runQuery(AppSettingsQuery)(pubkey),
  );
  getSubject(pubkey: string) {
    return this.parsed.get(pubkey);
  }
  requestAppSettings(pubkey: string, relays: Iterable<string>, opts?: RequestOptions) {
    replaceableEventsService.requestEvent(relays, APP_SETTINGS_KIND, pubkey, APP_SETTING_IDENTIFIER, opts);
    return this.parsed.get(pubkey);
  }

  buildAppSettingsEvent(settings: Partial<AppSettings>): DraftNostrEvent {
    return {
      kind: APP_SETTINGS_KIND,
      tags: [["d", APP_SETTING_IDENTIFIER]],
      content: JSON.stringify(settings),
      created_at: dayjs().unix(),
    };
  }
}

const userAppSettings = new UserAppSettings();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userAppSettings = userAppSettings;
}

export default userAppSettings;
