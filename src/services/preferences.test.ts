import { afterEach, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@capacitor/preferences", () => ({ Preferences: storage }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

it("starts all preference reads before storage resolves and preserves decoded values and defaults", async () => {
  vi.stubGlobal("localStorage", {});
  vi.stubGlobal("window", {});
  const reads = new Map<string, (value: { value: string | null }) => void>();
  storage.get.mockImplementation(
    ({ key }: { key: string }) =>
      new Promise<{ value: string | null }>((resolve) => {
        reads.set(key, resolve);
      }),
  );

  const loaded = import("./preferences");
  try {
    await vi.waitFor(() => expect(reads.size).toBe(46));
  } finally {
    // Release pending reads even if concurrency regresses, avoiding a hanging module import.
    storage.get.mockResolvedValue({ value: null });
    for (const [key, resolve] of reads) {
      const values: Record<string, string> = {
        "hide-usernames": "true",
        "max-connections": "12",
        wallets: JSON.stringify([{ id: "test", name: "Wallet", uri: "nostr+walletconnect://test" }]),
      };
      resolve({ value: values[key] ?? null });
    }
  }

  const { default: settings } = await loaded;
  expect(settings.hideUsernames.value).toBe(true);
  expect(settings.maxConnections.value).toBe(12);
  expect(settings.wallets.value).toEqual([{ id: "test", name: "Wallet", uri: "nostr+walletconnect://test" }]);
  expect(settings.autoUnlockAll.value).toBe(false);
  expect(settings.enableNutWallet.value).toBe(true);
  expect(settings.encryptionSalt.value).toHaveLength(48);
  expect(storage.set).toHaveBeenCalledWith({ key: "encryption-salt", value: expect.any(String) });
  expect(storage.remove).toHaveBeenCalledWith({ key: "lookup-relays" });
});
