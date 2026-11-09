import type { Rumor } from "applesauce-common/helpers";
import { describe, expect, it } from "vitest";
import { createMessageExpiration, getMessageExpirationDuration, readMessageExpiration } from "../message-expiration";

const rumor = (value: string): Rumor => ({
  kind: 14,
  created_at: 1794251329,
  tags: [["expiration", value]],
  content: "hmm...",
  pubkey: "a".repeat(64),
  id: "b".repeat(64),
});

describe("message expiration", () => {
  it.each(["17942512502592076", "123junk", "NaN", "-1", "8640000000001", "1.5", ""])(
    "does not display or inherit malformed %s",
    (value) => {
      expect(readMessageExpiration(rumor(value))).toBeUndefined();
      expect(getMessageExpirationDuration(rumor(value))).toBeUndefined();
    },
  );
  it("inherits a positive lifetime even after the original message expires", () => {
    expect(getMessageExpirationDuration(rumor(String(1794251329 + 2592000)))).toBe(2592000);
    expect(getMessageExpirationDuration(rumor("1794251328"))).toBeUndefined();
  });
  it("adds seconds and handles off", () => {
    expect(createMessageExpiration(2592000, 1794251329)).toBe(1796843329);
    expect(createMessageExpiration(null)).toBeUndefined();
    expect(createMessageExpiration(undefined)).toBeUndefined();
  });
  it.each(["2592076", "null", -1, NaN, Infinity, 1.5, 17942512502592076])(
    "rejects corrupt outgoing duration %s",
    (value) => {
      expect(() => createMessageExpiration(value)).toThrow("Invalid message expiration");
    },
  );
});
