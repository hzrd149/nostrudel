import { describe, expect, it } from "vitest";

import { isWebxdcMessage } from "./jsonrpc";

describe("isWebxdcMessage", () => {
  it("accepts every envelope the old truthiness check accepted", () => {
    expect(isWebxdcMessage({ jsonrpc: "2.0" })).toBe(true);
    expect(isWebxdcMessage({ jsonrpc: "2.0", method: "webxdc.ready" })).toBe(true);
    expect(isWebxdcMessage({ jsonrpc: "2.0", id: 1, method: "webxdc.sendUpdate", params: {} })).toBe(true);
    // Non-string id/method must still pass so they reach the Method-not-found reply.
    expect(isWebxdcMessage({ jsonrpc: "2.0", id: null, method: 5, params: [] })).toBe(true);
    // An array carrying a jsonrpc property was accepted by the old property read.
    expect(isWebxdcMessage(Object.assign([], { jsonrpc: "2.0" }))).toBe(true);
    // A prototype-inherited jsonrpc property was accepted by the old property read.
    expect(isWebxdcMessage(Object.create({ jsonrpc: "2.0" }))).toBe(true);
  });

  it("rejects the values the old check rejected", () => {
    expect(isWebxdcMessage(null)).toBe(false);
    expect(isWebxdcMessage(undefined)).toBe(false);
    expect(isWebxdcMessage("")).toBe(false);
    expect(isWebxdcMessage("2.0")).toBe(false);
    expect(isWebxdcMessage(0)).toBe(false);
    expect(isWebxdcMessage(1)).toBe(false);
    expect(isWebxdcMessage(true)).toBe(false);
    expect(isWebxdcMessage(false)).toBe(false);
    expect(isWebxdcMessage([])).toBe(false);
    expect(isWebxdcMessage({})).toBe(false);
    expect(isWebxdcMessage({ jsonrpc: "1.0" })).toBe(false);
    expect(isWebxdcMessage({ jsonrpc: 2 })).toBe(false);
  });
});
