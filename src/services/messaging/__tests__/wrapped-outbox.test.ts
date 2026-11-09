import type { WrappedConversation, PreparedWrappedMessage } from "applesauce-extra/messages";
import { describe, expect, it, vi } from "vitest";
import { WrappedOutbox } from "../wrapped-outbox";

describe("wrapped outgoing queue", () => {
  it("rejects malformed expiration before queueing and preserves valid timestamps for both layers", async () => {
    const prepareSend = vi.fn().mockResolvedValue({ publish: vi.fn().mockResolvedValue(undefined) });
    const outbox = new WrappedOutbox({ prepareSend } as unknown as WrappedConversation);
    expect(() => outbox.enqueue({ content: "bad", expiration: 17942512502592076 })).toThrow(
      "Invalid message expiration",
    );
    expect(outbox.items$.value).toEqual([]);
    const [item] = outbox.enqueue({ content: "good", expiration: 1796843329 });
    await outbox.retry(item);
    expect(prepareSend.mock.calls[0][0]).toMatchObject({ expiration: 1796843329, envelopeExpiration: 1796843329 });
    outbox.dispose();
  });

  it("keeps an upload and prepared envelopes across partial publication retries", async () => {
    const publish = vi.fn().mockRejectedValueOnce(new Error("recipient offline")).mockResolvedValue(undefined);
    const prepared = { publish } as unknown as PreparedWrappedMessage;
    const uploadFile = vi.fn().mockResolvedValue({ url: "https://files.test/encrypted" });
    const prepareSend = vi.fn().mockResolvedValue(prepared);
    const outbox = new WrappedOutbox({ uploadFile, prepareSend } as unknown as WrappedConversation);
    const queued = outbox.enqueue({
      content: "caption",
      files: [new File(["secret"], "photo.png")],
      replyTo: "parent",
    });
    expect(queued).toHaveLength(2);
    await outbox.retry(queued[0]);
    expect(queued[0].state).toBe("failed");
    await outbox.retry(queued[0]);
    expect(queued[0].state).toBe("accepted");
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(prepareSend).toHaveBeenCalledTimes(1);
    expect(prepareSend.mock.calls[0][0].replyTo).toBe("parent");
    outbox.discard(queued[1]);
    expect(outbox.items$.value).toHaveLength(1);
    outbox.dispose();
  });

  it("retries preparation without uploading again and blocks late publication after account disposal", async () => {
    let resolve!: (value: PreparedWrappedMessage) => void;
    const publish = vi.fn();
    const uploadFile = vi.fn().mockResolvedValue({ url: "https://files.test/encrypted" });
    const prepareSend = vi
      .fn()
      .mockRejectedValueOnce(new Error("signer refused"))
      .mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
    const outbox = new WrappedOutbox({ uploadFile, prepareSend } as unknown as WrappedConversation);
    const [item] = outbox.enqueue({ content: "", files: [new File(["secret"], "file")] });
    await outbox.retry(item);
    expect(item.state).toBe("failed");
    const retrying = outbox.retry(item);
    outbox.dispose();
    resolve({ publish } as unknown as PreparedWrappedMessage);
    await retrying;
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
    expect(outbox.items$.value).toEqual([]);
  });
});
