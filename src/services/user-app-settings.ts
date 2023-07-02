import { CachedPubkeyEventRequester } from "../classes/cached-pubkey-event-requester";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { SuperMap } from "../classes/super-map";
import { PersistentSubject } from "../classes/subject";
import { safeJson } from "../helpers/parse";
import dayjs from "dayjs";
import { ColorMode } from "@chakra-ui/react";
import db from "./db";

const DTAG = "nostrudel-settings";

export type AppSettings = {
  colorMode: ColorMode;
  blurImages: boolean;
  autoShowMedia: boolean;
  proxyUserMedia: boolean;
  showReactions: boolean;
  showSignatureVerification: boolean;

  autoPayWithWebLN: boolean;
  customZapAmounts: string;

  primaryColor: string;
  imageProxy: string;
  corsProxy: string;
  showContentWarning: boolean;
  twitterRedirect?: string;
  redditRedirect?: string;
  youtubeRedirect?: string;
};

export const defaultSettings: AppSettings = {
  colorMode: "light",
  blurImages: true,
  autoShowMedia: true,
  proxyUserMedia: false,
  showReactions: true,
  showSignatureVerification: false,

  autoPayWithWebLN: true,
  customZapAmounts: "50,200,500,1000,2000,5000",

  primaryColor: "#8DB600",
  imageProxy: "",
  corsProxy: "",
  showContentWarning: true,
  twitterRedirect: undefined,
  redditRedirect: undefined,
  youtubeRedirect: undefined,
};

function parseAppSettings(event: NostrEvent): AppSettings {
  const json = safeJson(event.content, {});
  return {
    ...defaultSettings,
    ...json,
  };
}

class UserAppSettings {
  requester: CachedPubkeyEventRequester;
  constructor() {
    this.requester = new CachedPubkeyEventRequester(30078, "user-app-data", DTAG);
    this.requester.readCache = (pubkey) => db.get("settings", pubkey);
    this.requester.writeCache = (pubkey, event) => db.put("settings", event);
  }

  private parsedSubjects = new SuperMap<string, PersistentSubject<AppSettings>>(
    () => new PersistentSubject<AppSettings>(defaultSettings)
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
