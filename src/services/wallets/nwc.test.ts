import type { Transaction } from "applesauce-wallet-connect/helpers";
import { describe, expect, it, vi } from "vitest";

import { fromNwcTransaction } from "./nwc";

// nwc.ts imports the preferences service, which reads Capacitor storage through `window` at module
// load. The mapper under test never touches it, so stub the module rather than faking a browser.
vi.mock("../preferences", () => ({ default: {} }));

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    type: "incoming",
    state: "settled",
    amount: 21_000,
    fees_paid: 0,
    created_at: 1_700_000_000,
    ...overrides,
  };
}

describe("fromNwcTransaction", () => {
  it("converts msats to sats for the amount and fee", () => {
    const result = fromNwcTransaction(makeTransaction({ amount: 21_500, fees_paid: 3_999 }));

    expect(result.amount).toBe(21);
    expect(result.fee).toBe(3);
  });

  it("maps incoming transactions to direction in and anything else to out", () => {
    expect(fromNwcTransaction(makeTransaction({ type: "incoming" })).direction).toBe("in");
    expect(fromNwcTransaction(makeTransaction({ type: "outgoing" })).direction).toBe("out");
  });

  it("flags only pending transactions as pending", () => {
    expect(fromNwcTransaction(makeTransaction({ state: "pending" })).pending).toBe(true);
    expect(fromNwcTransaction(makeTransaction({ state: "settled" })).pending).toBe(false);
  });

  it("prefers the settled timestamp and falls back to the created timestamp", () => {
    expect(fromNwcTransaction(makeTransaction({ settled_at: 1_700_000_500 })).timestamp).toBe(1_700_000_500);
    expect(fromNwcTransaction(makeTransaction({ settled_at: undefined })).timestamp).toBe(1_700_000_000);
  });

  it("reports an undefined fee when the wallet charged none", () => {
    expect(fromNwcTransaction(makeTransaction({ fees_paid: 0 })).fee).toBeUndefined();
  });

  it("prefers the payment hash as the id, then the invoice, then a created_at and amount composite", () => {
    expect(fromNwcTransaction(makeTransaction({ payment_hash: "hash", invoice: "lnbc1" })).id).toBe("hash");
    expect(fromNwcTransaction(makeTransaction({ invoice: "lnbc1" })).id).toBe("lnbc1");
    expect(fromNwcTransaction(makeTransaction()).id).toBe("1700000000:21000");
  });

  it("passes the description through and tolerates it being absent", () => {
    expect(fromNwcTransaction(makeTransaction({ description: "coffee" })).description).toBe("coffee");
    expect(fromNwcTransaction(makeTransaction()).description).toBeUndefined();
  });
});
