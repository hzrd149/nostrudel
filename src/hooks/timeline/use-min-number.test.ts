import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ state: undefined as unknown }));
vi.mock("react", () => ({
  useState: (initial: unknown) => [
    (harness.state ??= initial),
    (next: unknown) => {
      harness.state = next;
    },
  ],
}));

import useMinNumber from "./use-min-number";

beforeEach(() => {
  harness.state = undefined;
});

describe("timeline minimum", () => {
  it("keeps the displayed range when a replacement loader starts at now", () => {
    expect(useMinNumber("/user/alice/notes", 1000)).toBe(1000);
    expect(useMinNumber("/user/alice/notes", 100)).toBe(100);
    expect(useMinNumber("/user/alice/notes", 1000)).toBe(100);
    expect(useMinNumber("/user/alice/notes", undefined)).toBe(100);
    expect(useMinNumber("/user/alice/notes", 50)).toBe(50);
  });

  it("resets immediately on navigation without retaining the previous page's floor", () => {
    expect(useMinNumber("/user/alice/notes", 100)).toBe(100);
    expect(useMinNumber("/user/bob/notes", 1000)).toBe(1000);
    expect(useMinNumber("/user/bob/notes", 500)).toBe(500);
  });

  it("starts without a floor until a loader supplies one", () => {
    expect(useMinNumber("/notes", undefined)).toBe(Infinity);
    expect(useMinNumber("/notes", 1000)).toBe(1000);
  });

  it("preserves a restored cursor across renders and accepts older visible dates", () => {
    expect(useMinNumber("cache-key", 100, 500)).toBe(100);
    expect(useMinNumber("cache-key", undefined, 500)).toBe(100);
    expect(useMinNumber("cache-key", 100, 50)).toBe(50);
  });
});
