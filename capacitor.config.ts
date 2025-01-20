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
  },
};

export default config;
