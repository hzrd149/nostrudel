import { ColorModeWithSystem } from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { safeJson } from "../../helpers/parse";

export type AppSettingsV0 = {
  version: 0;
  colorMode: ColorModeWithSystem;
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
};
export function isV0(settings: { version: number }): settings is AppSettingsV0 {
  return settings.version === undefined || settings.version === 0;
}
export function isV1(settings: { version: number }): settings is AppSettingsV1 {
  return settings.version === 1;
}

export type AppSettings = AppSettingsV1;

export const defaultSettings: AppSettings = {
  version: 1,
  colorMode: "system",
  blurImages: true,
  autoShowMedia: true,
  proxyUserMedia: false,
  showReactions: true,
  showSignatureVerification: false,

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
  if (isV0(settings)) return { ...settings, version: 1 };
  if (isV1(settings)) return settings;
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
