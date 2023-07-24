import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import db from "../db";
import { logger } from "../../helpers/debug";

import { SuperMap } from "../../classes/super-map";
import { PersistentSubject } from "../../classes/subject";
import { CachedPubkeyEventRequester } from "../../classes/cached-pubkey-event-requester";
import { AppSettings, defaultSettings, parseAppSettings } from "./migrations";

const DTAG = "nostrudel-settings";

class UserAppSettings {
  requester: CachedPubkeyEventRequester;
  log = logger.extend("UserAppSettings");

  constructor() {
    this.requester = new CachedPubkeyEventRequester(30078, "user-app-data", DTAG, this.log.extend("requester"));
    this.requester.readCache = (pubkey) => db.get("settings", pubkey);
    this.requester.writeCache = (pubkey, event) => db.put("settings", event);
  }

  private parsedSubjects = new SuperMap<string, PersistentSubject<AppSettings>>(
    (pubkey) => new PersistentSubject<AppSettings>(defaultSettings)
  );
  getSubject(pubkey: string) {
    return this.parsedSubjects.get(pubkey);
  }
  requestAppSettings(pubkey: string, relays: string[], alwaysRequest = false) {
    const sub = this.parsedSubjects.get(pubkey);
    const requestSub = this.requester.requestEvent(pubkey, relays, alwaysRequest);
    sub.connectWithHandler(requestSub, (event, next) => next(parseAppSettings(event)));
    return sub;
  }

  receiveEvent(event: NostrEvent) {
    this.requester.handleEvent(event);
  }

  update() {
    this.requester.update();
  }

  buildAppSettingsEvent(settings: AppSettings): DraftNostrEvent {
    return {
      kind: 30078,
      tags: [["d", DTAG]],
      content: JSON.stringify(settings),
      created_at: dayjs().unix(),
    };
  }
}

const userAppSettings = new UserAppSettings();

setInterval(() => {
  userAppSettings.update();
}, 1000 * 2);

if (import.meta.env.DEV) {
  // @ts-ignore
  window.userAppSettings = userAppSettings;
}

export default userAppSettings;
