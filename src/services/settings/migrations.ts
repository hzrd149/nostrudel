import { ColorModeWithSystem } from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { safeJson } from "../../helpers/parse";

export type AppSettingsV0 = {
  version: 0;
  colorMode: ColorModeWithSystem;
  defaultRelays: string[];
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
export type AppSettingsV7 = Omit<AppSettingsV6, "version"> & { version: 7; defaultRelays: string[] };

export function isV0(settings: { version: number }): settings is AppSettingsV0 {
  return settings.version === undefined || settings.version === 0;
}
export function isV1(settings: { version: number }): settings is AppSettingsV1 {
  return settings.version === 1;
}
export function isV2(settings: { version: number }): settings is AppSettingsV2 {
  return settings.version === 2;
}
export function isV3(settings: { version: number }): settings is AppSettingsV3 {
  return settings.version === 3;
}
export function isV4(settings: { version: number }): settings is AppSettingsV4 {
  return settings.version === 4;
}
export function isV5(settings: { version: number }): settings is AppSettingsV5 {
  return settings.version === 5;
}
export function isV6(settings: { version: number }): settings is AppSettingsV6 {
  return settings.version === 6;
}

export type AppSettings = AppSettingsV6;

export const defaultSettings: AppSettings = {
  version: 6,
  theme: "default",
  colorMode: "system",
  defaultRelays: ["wss://relay.damus.io", "wss://nostr.wine", "wss://nos.lol", "wss://welcome.nostr.wine"],
  maxPageWidth: "none",
  blurImages: true,
  hideUsernames: false,
  autoShowMedia: true,
  proxyUserMedia: false,
  loadOpenGraphData: true,
  showReactions: true,
  showSignatureVerification: false,
  noteDifficulty: null,

  quickReactions: ["🤙", "❤️", "🤣", "😍", "🔥"],

  autoPayWithWebLN: true,
  customZapAmounts: "50,200,500,1000,2000,5000",

  primaryColor: "#8DB600",
  imageProxy: "",
  corsProxy: "https://corsproxy.io/?<encoded_url>",
  showContentWarning: true,
  twitterRedirect: undefined,
  redditRedirect: undefined,
  youtubeRedirect: undefined,
};

export function upgradeSettings(settings: { version: number }): AppSettings | null {
  if (isV0(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV1(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV2(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV3(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV4(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV5(settings)) return { ...defaultSettings, ...settings, version: 6 };
  if (isV6(settings)) return settings;
  return null;
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
