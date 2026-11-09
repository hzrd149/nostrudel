import { describe, expect, it } from "vitest";

import { describeStrayMessage } from "../stray-message";

describe("describeStrayMessage", () => {
  it("names the message type", () => {
    expect(describeStrayMessage({ type: "relay.req", payload: { secret: 1 } })).toBe('type "relay.req"');
  });

  it("falls back to the extension source field", () => {
    expect(describeStrayMessage({ source: "react-devtools-content-script", hello: true })).toBe(
      'source "react-devtools-content-script"',
    );
  });

  it("lists keys without values when no identifying field exists", () => {
    expect(describeStrayMessage({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 })).toBe("{a, b, c, d, e, f, …}");
  });

  it("describes primitives by type only", () => {
    expect(describeStrayMessage("private text")).toBe("string");
    expect(describeStrayMessage(null)).toBe("object");
  });
});
