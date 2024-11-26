import { ColorModeWithSystem } from "@chakra-ui/react";
import { NostrEvent } from "../types/nostr-event";
import { safeJson } from "./parse";

export type AppSettingsV0 = {
  version: 0;
  colorMode: ColorModeWithSystem;
  defaultRelays: string[];
  blurImages: boolean;
  autoShowMedia: boolean;
  proxyUserMedia: boolean;
  showReactions: boolean;
  /** @deprecated */
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
export type AppSettingsV1 = Omit<AppSettingsV0, "version"> & {
  version: 1;
  mutedWords?: string;
  maxPageWidth: "none" | "md" | "lg" | "xl";
};
export type AppSettingsV2 = Omit<AppSettingsV1, "version"> & { version: 2; theme: string };
export type AppSettingsV3 = Omit<AppSettingsV2, "version"> & { version: 3; quickReactions: string[] };
export type AppSettingsV4 = Omit<AppSettingsV3, "version"> & { version: 4; loadOpenGraphData: boolean };
export type AppSettingsV5 = Omit<AppSettingsV4, "version"> & { version: 5; hideUsernames: boolean };
export type AppSettingsV6 = Omit<AppSettingsV5, "version"> & { version: 6; noteDifficulty: number | null };
export type AppSettingsV7 = Omit<AppSettingsV6, "version"> & { version: 7; autoDecryptDMs: boolean };
export type AppSettingsV8 = Omit<AppSettingsV7, "version"> & {
  version: 8;
  mediaUploadService: "nostr.build" | "blossom";
};
export type AppSettingsV9 = Omit<AppSettingsV8, "version"> & { version: 9; removeEmojisInUsernames: boolean };

export type AppSettingsV10 = Omit<AppSettingsV9, "version" | "defaultRelays"> & {
  version: 10;
  showPubkeyColor: "none" | "avatar" | "underline";
};

export type AppSettings = AppSettingsV10;

export const defaultSettings: AppSettings = {
  version: 10,

  // display
  theme: "default",
  colorMode: "system",
  primaryColor: "#8DB600",
  maxPageWidth: "none",
  showPubkeyColor: "avatar",
  blurImages: true,
  hideUsernames: false,
  removeEmojisInUsernames: false,
  autoShowMedia: true,
  showContentWarning: true,
  loadOpenGraphData: true,
  /** @deprecated */
  showSignatureVerification: false,

  // posting
  noteDifficulty: null,
  proxyUserMedia: false,

  // performance
  showReactions: true,
  autoDecryptDMs: false,

  quickReactions: ["🤙", "❤️", "🤣", "😍", "🔥"],
  mediaUploadService: "nostr.build",

  // lightning
  autoPayWithWebLN: true,
  customZapAmounts: "50,200,500,1000,2000,5000",

  // privacy
  imageProxy: "",
  corsProxy: "",
  twitterRedirect: undefined,
  redditRedirect: undefined,
  youtubeRedirect: undefined,
};

export function upgradeSettings(settings: { version: number }): AppSettings | null {
  return { ...defaultSettings, ...settings, version: 10 };
}

export function parseAppSettings(event: NostrEvent): AppSettings {
  const json = safeJson(event.content, {});
  const upgraded = upgradeSettings(json);

  return upgraded
    ? {
        ...defaultSettings,
        ...upgraded,
      }
    : defaultSettings;
}
