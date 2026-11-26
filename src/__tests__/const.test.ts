import { afterEach, describe, expect, it, vi } from "vitest";

import { getNostrConnectAppMetadata } from "../const";

describe("getNostrConnectAppMetadata", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("builds the app metadata from the current origin", () => {
    vi.stubGlobal("location", { protocol: "https:", host: "nostrudel.ninja" });

    expect(getNostrConnectAppMetadata()).toEqual({
      name: "noStrudel",
      url: "https://nostrudel.ninja",
      image: "https://nostrudel.ninja/apple-touch-icon.png",
    });
  });

  it("includes the port when the app is served from one", () => {
    vi.stubGlobal("location", { protocol: "http:", host: "localhost:5173" });

    expect(getNostrConnectAppMetadata()).toEqual({
      name: "noStrudel",
      url: "http://localhost:5173",
      image: "http://localhost:5173/apple-touch-icon.png",
    });
  });
});
