import dayjs from "dayjs";

import { DraftNostrEvent } from "../../types/nostr-event";

import SuperMap from "../../classes/super-map";
import { PersistentSubject } from "../../classes/subject";
import { AppSettings, defaultSettings, parseAppSettings } from "./migrations";
import replaceableEventLoaderService, { RequestOptions } from "../replaceable-event-requester";

export const APP_SETTINGS_KIND = 30078;
export const SETTING_EVENT_IDENTIFIER = "nostrudel-settings";

class UserAppSettings {
  private parsedSubjects = new SuperMap<string, PersistentSubject<AppSettings>>(
    () => new PersistentSubject<AppSettings>(defaultSettings),
  );
  getSubject(pubkey: string) {
    return this.parsedSubjects.get(pubkey);
  }
  requestAppSettings(pubkey: string, relays: Iterable<string>, opts?: RequestOptions) {
    const sub = this.parsedSubjects.get(pubkey);
    const requestSub = replaceableEventLoaderService.requestEvent(
      relays,
      APP_SETTINGS_KIND,
      pubkey,
      SETTING_EVENT_IDENTIFIER,
      opts,
    );
    sub.connectWithMapper(requestSub, (event, next) => next(parseAppSettings(event)));
    return sub;
  }

  buildAppSettingsEvent(settings: AppSettings): DraftNostrEvent {
    return {
      kind: APP_SETTINGS_KIND,
      tags: [["d", SETTING_EVENT_IDENTIFIER]],
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
