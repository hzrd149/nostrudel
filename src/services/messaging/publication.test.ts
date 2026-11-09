import type { PreparedWrappedMessage } from "applesauce-extra/messages";
import type { Rumor } from "applesauce-core/helpers";
import { describe, expect, it, vi } from "vitest";
import { MessagePublication } from "./publication";

const message: Rumor = {
  id: "a".repeat(64),
  pubkey: "b".repeat(64),
  kind: 14,
  content: "hello",
  created_at: 1,
  tags: [],
};

describe("message publication ownership", () => {
  it("retains the same prepared envelopes after partial failure and never prepares a second message on retry", async () => {
    const publish = vi.fn().mockRejectedValueOnce(new Error("Recipient offline")).mockResolvedValueOnce(message);
    const prepared: PreparedWrappedMessage = { message, publications: [], publish };
    const prepare = vi.fn(async () => prepared);
    const publication = new MessagePublication(prepare);
    await expect(publication.send({ content: "hello" })).rejects.toThrow("Recipient offline");
    expect(publication.pending$.value).toBe(prepared);
    expect(publication.busy$.value).toBe(false);
    await publication.send({ content: "different draft" });
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(publication.pending$.value).toBeUndefined();
    publication.dispose();
  });

  it("does not publish a late signer result after the account session is disposed", async () => {
    const publish = vi.fn(async () => message);
    let resolve!: (prepared: PreparedWrappedMessage) => void;
    const publication = new MessagePublication(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const sending = publication.send({ content: "hello" });
    const rejected = expect(sending).rejects.toThrow();
    await expect(publication.send({ content: "duplicate" })).rejects.toThrow("already in progress");
    publication.dispose();
    resolve({ message, publications: [], publish });
    await rejected;
    expect(publish).not.toHaveBeenCalled();
  });
});
