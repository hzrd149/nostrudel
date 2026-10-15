import { DEFAULT_INFORMATION_CACHE_MS, Relay } from "applesauce-relay";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => vi.stubGlobal("window", {}));
vi.mock("../helpers/request", () => ({ fetchWithProxy: vi.fn() }));
vi.mock("./pool", () => ({ default: { relay: vi.fn() } }));
vi.mock("./relay-information-cache", () => ({ relayInformationCache: { set: vi.fn() } }));

import { fetchWithProxy } from "../helpers/request";
import { AppRelay } from "../classes/app-relay";
import pool from "./pool";
import relayInfoService from "./relay-info";
import { relayInformationCache } from "./relay-information-cache";

afterEach(() => vi.clearAllMocks());

describe("relay information service", () => {
  it("uses the pool's shared information for ordinary reads", async () => {
    const relay = new AppRelay("wss://example.com");
    const getInformation = vi.spyOn(relay, "getInformation").mockResolvedValue(null);
    vi.mocked(pool.relay).mockReturnValue(relay);
    expect(await relayInfoService.getInfo("wss://example.com")).toBeNull();
    expect(getInformation).toHaveBeenCalledTimes(1);
    expect(fetchWithProxy).not.toHaveBeenCalled();
    relay.close();
  });

  it("refreshes through the proxy with a timeout and stores the normalized document", async () => {
    const document = { name: "Fresh" };
    vi.mocked(fetchWithProxy).mockResolvedValue(new Response(JSON.stringify(document)));
    expect(await relayInfoService.getInfo("wss://example.com", true)).toEqual(document);
    expect(fetchWithProxy).toHaveBeenCalledWith("https://example.com/", {
      headers: { Accept: "application/nostr+json" },
      signal: expect.any(AbortSignal),
    });
    expect(relayInformationCache.set).toHaveBeenCalledWith(
      "wss://example.com/",
      document,
      DEFAULT_INFORMATION_CACHE_MS,
    );
  });

  it("returns null for failed requests without persisting them", async () => {
    vi.mocked(fetchWithProxy).mockResolvedValueOnce(new Response("not found", { status: 404 }));
    expect(await relayInfoService.getInfo("wss://example.com", true)).toBeNull();
    vi.mocked(fetchWithProxy).mockRejectedValueOnce(new Error("offline"));
    expect(await Relay.fetchInformationDocument("wss://example.com")).toBeNull();
    expect(relayInformationCache.set).not.toHaveBeenCalled();
  });

  it("returns refreshed information even when persistence fails", async () => {
    vi.mocked(fetchWithProxy).mockResolvedValue(new Response(JSON.stringify({ name: "Fresh" })));
    vi.mocked(relayInformationCache.set).mockRejectedValueOnce(new Error("storage unavailable"));
    expect(await relayInfoService.getInfo("wss://example.com", true)).toEqual({ name: "Fresh" });
  });
});
