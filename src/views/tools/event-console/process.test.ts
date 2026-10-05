import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseTimeUnit, processDateString } from "./process";

describe("parseTimeUnit", () => {
  it("maps lowercase unit letters to dayjs units", () => {
    expect(parseTimeUnit("h")).toBe("hour");
    expect(parseTimeUnit("w")).toBe("week");
    expect(parseTimeUnit("m")).toBe("minute");
    expect(parseTimeUnit("s")).toBe("second");
    expect(parseTimeUnit("d")).toBe("day");
  });

  it("maps uppercase unit letters the same as lowercase", () => {
    expect(parseTimeUnit("H")).toBe("hour");
    expect(parseTimeUnit("W")).toBe("week");
    expect(parseTimeUnit("M")).toBe("minute");
    expect(parseTimeUnit("S")).toBe("second");
    expect(parseTimeUnit("D")).toBe("day");
  });

  it("defaults to hour when no unit is given", () => {
    expect(parseTimeUnit(undefined)).toBe("hour");
  });
});

describe("processDateString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current time for now and n", () => {
    expect(processDateString("now")).toBe(dayjs().unix());
    expect(processDateString("n")).toBe(dayjs().unix());
  });

  it("subtracts lowercase units", () => {
    expect(processDateString("n-2d")).toBe(dayjs().subtract(2, "day").unix());
    expect(processDateString("n-5h")).toBe(dayjs().subtract(5, "hour").unix());
  });

  it("treats uppercase units the same as lowercase", () => {
    expect(processDateString("n-5H")).toBe(processDateString("n-5h"));
    expect(processDateString("n-5H")).toBe(dayjs().subtract(5, "hour").unix());
    expect(processDateString("n+4M")).toBe(dayjs().add(4, "minute").unix());
    expect(processDateString("n-30S")).toBe(dayjs().subtract(30, "second").unix());
    expect(processDateString("n-4W")).toBe(dayjs().subtract(4, "week").unix());
    expect(processDateString("n-7D")).toBe(dayjs().subtract(7, "day").unix());
  });

  it("adds relative time", () => {
    expect(processDateString("n+4m")).toBe(dayjs().add(4, "minute").unix());
  });

  it("defaults to hours when no unit is given", () => {
    expect(processDateString("n-5")).toBe(dayjs().subtract(5, "hour").unix());
  });

  it("throws for strings it cannot parse", () => {
    expect(() => processDateString("tomorrow")).toThrow();
    expect(() => processDateString("n*5")).toThrow();
  });
});
