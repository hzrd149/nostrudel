import { ColorModeWithSystem } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

export const APP_SETTINGS_KIND = kinds.Application;
export const APP_SETTING_IDENTIFIER = "nostrudel-settings";

type AppSettingsV0 = {
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
type AppSettingsV1 = Omit<AppSettingsV0, "version"> & {
  version: 1;
  mutedWords?: string;
  maxPageWidth: "none" | "sm" | "md" | "lg" | "xl" | "full";
};
type AppSettingsV2 = Omit<AppSettingsV1, "version"> & { version: 2; theme: string };
type AppSettingsV3 = Omit<AppSettingsV2, "version"> & { version: 3; quickReactions: string[] };
type AppSettingsV4 = Omit<AppSettingsV3, "version"> & { version: 4; loadOpenGraphData: boolean };
type AppSettingsV5 = Omit<AppSettingsV4, "version"> & { version: 5; hideUsernames: boolean };
type AppSettingsV6 = Omit<AppSettingsV5, "version"> & { version: 6; noteDifficulty: number | null };
type AppSettingsV7 = Omit<AppSettingsV6, "version"> & { version: 7; autoDecryptDMs: boolean };
type AppSettingsV8 = Omit<AppSettingsV7, "version"> & {
  version: 8;
  mediaUploadService: "nostr.build" | "blossom";
};
type AppSettingsV9 = Omit<AppSettingsV8, "version"> & { version: 9; removeEmojisInUsernames: boolean };

type AppSettingsV10 = Omit<AppSettingsV9, "version" | "defaultRelays"> & {
  version: 10;
  showPubkeyColor: "none" | "avatar" | "underline";
};

type AppSettingsV11 = Omit<AppSettingsV10, "quickReactions" | "version"> & {
  version: 11;
};

type AppSettingsV12 = Omit<AppSettingsV11, "showSignatureVerification" | "version"> & {
  version: 12;
  mirrorBlobsOnShare: boolean;
};

type AppSettingsV13 = Omit<AppSettingsV12, "version" | "mutedWords" | "autoShowMedia" | "blurImages"> & {
  version: 13;
};

type AppSettingsV14 = Omit<AppSettingsV13, "version" | "autoDecryptDMs" | "proxyUserMedia"> & {
  version: 14;
};

type AppSettingsV15 = Omit<AppSettingsV14, "version" | "hideUsernames"> & {
  version: 15;
  shareService?: string;
};

export type AppSettings = AppSettingsV15;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: 15,

  // display
  theme: "default",
  colorMode: "system",
  primaryColor: "#8DB600",
  maxPageWidth: "none",
  showPubkeyColor: "avatar",
  removeEmojisInUsernames: false,
  showContentWarning: true,
  loadOpenGraphData: true,

  // posting
  noteDifficulty: null,
  mirrorBlobsOnShare: false,

  // performance
  showReactions: true,

  mediaUploadService: "nostr.build",

  // lightning
  autoPayWithWebLN: true,
  customZapAmounts: "50,200,500,1000,2000,5000",

  // privacy
  imageProxy: "",
  corsProxy: "",
  shareService: "https://njump.me/",
  twitterRedirect: undefined,
  redditRedirect: undefined,
  youtubeRedirect: undefined,
};
