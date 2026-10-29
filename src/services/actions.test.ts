import { finalizeEvent } from "nostr-tools";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  add: vi.fn(),
  getReplaceable: vi.fn(),
  send: undefined as undefined | ((event: unknown) => Promise<void>),
}));
vi.mock("applesauce-actions", () => ({
  ActionHub: class {
    constructor(_store: unknown, _signer: unknown, send: (event: unknown) => Promise<void>) {
      mocks.send = send;
    }
  },
}));
vi.mock("./accounts", () => ({ default: { signer: {} } }));
vi.mock("./event-store", () => ({ eventStore: { add: mocks.add, getReplaceable: mocks.getReplaceable } }));
vi.mock("./pool", () => ({ default: { publish: mocks.publish } }));

import "./actions";

it("propagates asynchronous publish failures to the action caller", async () => {
  const event = finalizeEvent({ kind: 1, content: "test", created_at: 1, tags: [] }, new Uint8Array(32).fill(1));
  mocks.getReplaceable.mockReturnValue({ ...event, kind: 10002, tags: [["r", "wss://offline.example", "write"]] });
  let rejectPublish!: (error: Error) => void;
  mocks.publish.mockReturnValue(
    new Promise((_, reject) => {
      rejectPublish = reject;
    }),
  );

  const result = mocks.send!(event);
  const failure = new Error("All relays failed");
  const rejected = expect(result).rejects.toThrow(failure);
  rejectPublish(failure);
  await rejected;
  expect(mocks.add).toHaveBeenCalledWith(event);
});
