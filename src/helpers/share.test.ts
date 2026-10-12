import { describe, expect, it } from "vitest";

import { DEFAULT_SHARE_SERVICE, SHARE_SERVICES } from "../const";
import { buildShareUrl } from "./share";

const id = "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m";

describe("buildShareUrl", () => {
  it("uses the default service when the setting is unset or empty", () => {
    expect(buildShareUrl(id)).toBe(DEFAULT_SHARE_SERVICE + id);
    expect(buildShareUrl(id, "")).toBe(DEFAULT_SHARE_SERVICE + id);
  });

  it("uses a configured absolute service url", () => {
    const service = SHARE_SERVICES[1];
    expect(buildShareUrl(id, service)).toBe(service + id);
  });

  it("falls back to the default service when the setting is not an absolute url", () => {
    expect(buildShareUrl(id, "share.example")).toBe(DEFAULT_SHARE_SERVICE + id);
    expect(buildShareUrl(id, "share.example/")).toBe(DEFAULT_SHARE_SERVICE + id);
  });

  it("returns the njump link by default", () => {
    expect(buildShareUrl(id)).toBe(`https://njump.me/${id}`);
  });

  it("uses a configured https service", () => {
    expect(buildShareUrl(id, "https://nostr.com/")).toBe(`https://nostr.com/${id}`);
  });

  it.each(["localhost:3000", "njump.me:443/", "mailto:x", "data:text/plain,x", "nostr:"])(
    "falls back to the default service when the setting %s cannot resolve the id over http(s)",
    (service) => {
      expect(buildShareUrl(id, service)).toBe(DEFAULT_SHARE_SERVICE + id);
    },
  );
});
