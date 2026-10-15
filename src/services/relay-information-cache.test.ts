import { DEFAULT_INFORMATION_CACHE_MS, Relay } from "applesauce-relay";
import { afterEach, describe, expect, it, vi } from "vitest";

const { entries } = vi.hoisted(() => ({ entries: new Map<string, unknown>() }));
vi.mock("./database", () => ({
  default: {
    get: async (_store: string, key: string) => entries.get(key),
    put: async (_store: string, value: unknown, key: string) => entries.set(key, value),
  },
}));

import { relayInformationCache } from "./relay-information-cache";

afterEach(() => {
  entries.clear();
  vi.restoreAllMocks();
});

describe("relay information cache", () => {
  it("shares normalized documents between relay instances and expires them", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const document = {
      name: "Example",
      description: "",
      pubkey: "",
      contact: "",
      supported_nips: [1, 77],
      software: "",
      version: "",
    };
    const fetch = vi.spyOn(Relay, "fetchInformationDocument").mockResolvedValue(document);
    const options = { informationCache: relayInformationCache };
    const first = new Relay("wss://example.com", options);
    const second = new Relay("wss://example.com/", options);
    expect(await first.getInformation()).toEqual(document);
    expect(await second.getInformation()).toEqual(document);
    expect(fetch).toHaveBeenCalledTimes(1);

    now += DEFAULT_INFORMATION_CACHE_MS + 1;
    const third = new Relay("wss://example.com", options);
    expect(await third.getInformation()).toEqual(document);
    expect(fetch).toHaveBeenCalledTimes(2);
    first.close();
    second.close();
    third.close();
  });

  it("refreshes legacy documents without expiry and does not persist missing documents", async () => {
    entries.set("wss://example.com/", { name: "Legacy" });
    const fetch = vi
      .spyOn(Relay, "fetchInformationDocument")
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        name: "New",
        description: "",
        pubkey: "",
        contact: "",
        supported_nips: [],
        software: "",
        version: "",
      });
    const first = new Relay("wss://example.com", { informationCache: relayInformationCache });
    const second = new Relay("wss://example.com", { informationCache: relayInformationCache });
    expect(await first.getInformation()).toBeNull();
    expect(await second.getInformation()).toMatchObject({ name: "New" });
    expect(fetch).toHaveBeenCalledTimes(2);
    first.close();
    second.close();
  });
});
