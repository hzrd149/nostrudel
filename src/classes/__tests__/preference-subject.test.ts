import { Preferences } from "@capacitor/preferences";
import { describe, expect, it, vi } from "vitest";
import { PreferenceSubject } from "../preference-subject";

vi.mock("@capacitor/preferences", () => ({ Preferences: { get: vi.fn(), set: vi.fn() } }));

describe("nullable numeric preferences", () => {
  it.each([
    ["2592000", 2592000],
    ["null", null],
    ["garbage", 7],
    ["Infinity", 7],
    ["", 7],
    ["   ", 7],
  ])("decodes stored %s", async (raw, expected) => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: raw as string });
    const preference = await PreferenceSubject.numberNullable("expiration", 7);
    expect(preference.value).toBe(expected);
  });

  it("round trips numbers and off across reloads", async () => {
    let stored: string | null = null;
    vi.mocked(Preferences.get).mockImplementation(async () => ({ value: stored }));
    vi.mocked(Preferences.set).mockImplementation(async ({ value }) => {
      stored = value;
    });
    const preference = await PreferenceSubject.numberNullable("expiration");
    await preference.next(2592000);
    expect((await PreferenceSubject.numberNullable("expiration")).value).toBe(2592000);
    await preference.next(null);
    expect((await PreferenceSubject.numberNullable("expiration")).value).toBeNull();
  });
});
