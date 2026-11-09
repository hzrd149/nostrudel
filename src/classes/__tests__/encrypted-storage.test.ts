import { describe, expect, it, vi } from "vitest";

import EncryptedStorage from "../encrypted-storage";

describe("message cache password setup", () => {
  it("distinguishes a new cache from an empty cache with an existing password", async () => {
    const entries = new Map<string, unknown>();
    const database = {
      getItem: vi.fn(async (key: string) => entries.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: unknown) => {
        entries.set(key, value);
        return value;
      }),
      clear: vi.fn(async () => entries.clear()),
    } as unknown as LocalForageDbMethods;
    const salt = new Uint8Array(16);
    const cache = new EncryptedStorage(database, salt);

    expect(await cache.hasPassword()).toBe(false);
    expect(await cache.unlock("cache-password")).toBe(true);

    const reopened = new EncryptedStorage(database, salt);
    expect(await reopened.hasPassword()).toBe(true);
    expect(await reopened.unlock("wrong-password")).toBe(false);
    expect(await reopened.unlock("cache-password")).toBe(true);

    await reopened.clear();
    expect(await reopened.hasPassword()).toBe(false);
  });
});
