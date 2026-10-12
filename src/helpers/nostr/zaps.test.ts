import { getZapPayment, getZapRequest, isValidZap } from "applesauce-common/helpers";
import { finalizeEvent, kinds } from "nostr-tools";
import { describe, expect, it } from "vitest";

const key = new Uint8Array(32).fill(1);

function zap(tags: string[][], kind: number = kinds.Zap) {
  return finalizeEvent({ kind, created_at: 100, tags, content: "" }, key);
}

const malformedReceipts: [string, string[][]][] = [
  ["no tags", []],
  ["an empty tag array", [[]]],
  ["a garbage bolt11 tag", [["bolt11", "not a lightning invoice"]]],
  ["a description that is invalid JSON", [["description", "{not json"]]],
  ["a description of null", [["description", "null"]]],
  ["a description of a number", [["description", "123"]]],
];

describe("isValidZap on malformed zap receipts", () => {
  it.each(malformedReceipts)("returns false without throwing for %s", (_name, tags) => {
    const event = zap(tags);
    expect(() => isValidZap(event)).not.toThrow();
    expect(isValidZap(event)).toBe(false);
  });

  it.each(malformedReceipts)("getZapPayment and getZapRequest return undefined for %s", (_name, tags) => {
    const event = zap(tags);
    expect(() => getZapPayment(event)).not.toThrow();
    expect(() => getZapRequest(event)).not.toThrow();
    expect(getZapPayment(event)).toBeUndefined();
    expect(getZapRequest(event)).toBeUndefined();
  });

  it("returns false without throwing for a non-zap kind carrying zap tags", () => {
    const event = zap(
      [
        ["bolt11", "not a lightning invoice"],
        ["description", "{not json"],
      ],
      kinds.ShortTextNote,
    );
    expect(() => isValidZap(event)).not.toThrow();
    expect(isValidZap(event)).toBe(false);
  });
});
