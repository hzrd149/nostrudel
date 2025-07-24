import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ninja.nostrudel",
  appName: "noStrudel",
  webDir: "dist",
  backgroundColor: "171819",
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: "Library/noStrudel",
      iosIsEncryption: false,
      androidIsEncryption: false,
      electronIsEncryption: false,
      electronWindowsLocation: "C:\\ProgramData\\noStrudel",
      electronMacLocation: "/Volumes/Development_Lacie/Development/noStrudel",
      electronLinuxLocation: "noStrudel",
    },
  },
};

export default config;
