import { describe, expect, expectTypeOf, it } from "vitest";

import { resolvePromises } from "../promise";

describe("resolvePromises", () => {
  it("preserves named result types and values regardless of completion order", async () => {
    let resolveFirst!: (value: number) => void;
    const first = new Promise<number>((resolve) => {
      resolveFirst = resolve;
    });
    const result = resolvePromises({ first, second: Promise.resolve("ready"), third: true });
    resolveFirst(42);

    expect(await result).toEqual({ first: 42, second: "ready", third: true });
    expectTypeOf(await result).toEqualTypeOf<{ first: number; second: string; third: boolean }>();
  });

  it("propagates failures without waiting for other pending operations", async () => {
    const failure = new Error("Storage unavailable");
    await expect(
      resolvePromises({ pending: new Promise<never>(() => {}), failed: Promise.reject(failure) }),
    ).rejects.toBe(failure);
  });
});
