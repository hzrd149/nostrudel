import { GiftWrapFactory, WrappedMessageFactory } from "applesauce-common/factories";
import { getRumorGiftWraps } from "applesauce-common/helpers";
import { EventStore } from "applesauce-core";
import { getEncryptedContent, getEventHash } from "applesauce-core/helpers";
import { nip19 } from "nostr-tools";
import { RelayPool } from "applesauce-relay";
import { PrivateKeySigner } from "applesauce-signers";
import type { GiftWrapProcessingRecord } from "applesauce-extra/gift-wrap";
import { firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { MessagingSession, MessageConversation } from "../session";

async function setup() {
  const signer = new PrivateKeySigner(new Uint8Array(32).fill(1));
  const sender = new PrivateKeySigner(new Uint8Array(32).fill(2));
  const pubkey = await signer.getPublicKey();
  const other = await sender.getPublicKey();
  const eventStore = new EventStore();
  const pool = new RelayPool();
  const cache = new Map<string, string>();
  const decryptionCache = {
    getItem: (id: string) => cache.get(id) ?? null,
    setItem: (id: string, value: string) => {
      cache.set(id, value);
    },
  };
  const options = { pubkey, signer, eventStore, pool, decryptionCache, timeout: 50 };
  const records = new Map<string, GiftWrapProcessingRecord>();
  const processingStore = {
    list: () => [...records.values()],
    set: (record: GiftWrapProcessingRecord) => {
      records.set(record.eventId, record);
    },
  };
  const session = new MessagingSession(options, { ...options, receiverOptions: { processingStore } });
  return { signer, sender, pubkey, other, eventStore, pool, session, decryptionCache, processingStore };
}

describe("messaging client integration", () => {
  it("includes used emoji metadata in the encrypted rumor without turning mentions into recipients", async () => {
    const ctx = await setup();
    ctx.eventStore.add(
      await ctx.signer.signEvent({ kind: 10050, created_at: 1, content: "", tags: [["relay", "wss://messages.test"]] }),
    );
    const publish = vi
      .spyOn(ctx.pool, "publish")
      .mockResolvedValue([{ from: "wss://messages.test/", ok: true, message: "" }]);
    const outbox = ctx.session.outbox([ctx.pubkey]);
    const [item] = outbox.enqueue({
      content: `:nostopus_spin: nostr:${nip19.npubEncode(ctx.other)}`,
      emojis: [
        { shortcode: "nostopus_spin", url: "https://emoji.test/spin.gif" },
        { shortcode: "unused", url: "https://emoji.test/unused.gif" },
      ],
    });
    await outbox.retry(item);
    expect(item.state).toBe("accepted");
    const rumor = item.prepared!.message;
    expect(rumor.tags.filter((tag) => tag[0] === "emoji")).toEqual([
      ["emoji", "nostopus_spin", "https://emoji.test/spin.gif"],
    ]);
    expect(rumor.tags.filter((tag) => tag[0] === "p")).toEqual([["p", ctx.pubkey]]);
    expect(rumor.id).toBe(getEventHash(rumor));
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][1].tags.some((tag) => tag[0] === "emoji")).toBe(false);
    ctx.session.dispose();
    ctx.eventStore.dispose();
  });

  it("publishes notes to self as one envelope and shares pending handles across equivalent routes", async () => {
    const ctx = await setup();
    ctx.eventStore.add(
      await ctx.signer.signEvent({ kind: 10050, created_at: 1, content: "", tags: [["relay", "wss://messages.test"]] }),
    );
    const publish = vi
      .spyOn(ctx.pool, "publish")
      .mockResolvedValue([{ from: "wss://messages.test/", ok: true, message: "" }]);
    expect(ctx.session.publication("nip17", [ctx.other])).toBe(
      ctx.session.publication("nip17", [ctx.pubkey, ctx.other]),
    );
    await ctx.session.publication("nip17", [ctx.pubkey]).send({ content: "self note" });
    expect(publish).toHaveBeenCalledTimes(1);
    expect((await ctx.session.wrapped.conversation(ctx.pubkey).getMessages({}))[0].content).toBe("self note");
    ctx.session.dispose();
    ctx.eventStore.dispose();
  });

  it("does not silently deliver wrapped messages to NIP-65 inboxes when NIP-17 relays are missing", async () => {
    const ctx = await setup();
    ctx.eventStore.add(
      await ctx.signer.signEvent({
        kind: 10002,
        created_at: 1,
        content: "",
        tags: [["r", "wss://legacy.test", "read"]],
      }),
    );
    ctx.eventStore.add(await ctx.signer.signEvent({ kind: 10050, created_at: 1, content: "", tags: [] }));
    const publish = vi.spyOn(ctx.pool, "publish");
    await expect(ctx.session.publication("nip17", [ctx.pubkey]).send({ content: "unsupported" })).rejects.toThrow();
    expect(publish).not.toHaveBeenCalled();
    ctx.session.dispose();
    ctx.eventStore.dispose();
  });

  it("merges legacy and wrapped conversation activity while keeping validated rumors out of the event store", async () => {
    const ctx = await setup();
    let rows: MessageConversation[] = [];
    const sub = ctx.session.conversations$.subscribe((value) => {
      rows = value;
    });
    const legacy = await ctx.sender.signEvent({
      kind: 4,
      created_at: 1,
      tags: [["p", ctx.pubkey]],
      content: await ctx.sender.nip04.encrypt(ctx.pubkey, "old"),
    });
    ctx.eventStore.add(legacy);
    await ctx.session.legacy.unlock(legacy);
    expect(getEncryptedContent(legacy)).toBe("old");
    const gift = structuredClone(
      await GiftWrapFactory.create(ctx.sender, ctx.pubkey, WrappedMessageFactory.create(ctx.pubkey, "new")),
    );
    await ctx.session.wrapped.receiver.ingest(gift);
    await ctx.session.wrapped.unlock(gift);
    const messages = await ctx.session.wrapped.conversation(ctx.other).getMessages({});
    expect(messages.map((message) => message.content)).toEqual(["new"]);
    expect(ctx.eventStore.getEvent(messages[0].id)).toBeUndefined();
    expect(getRumorGiftWraps(messages[0]).map((event) => event.id)).toContain(gift.id);
    await expect.poll(() => rows.length).toBe(1);
    await expect.poll(() => rows[0]?.lastMessage?.content).toBe("new");
    const third = await new PrivateKeySigner(new Uint8Array(32).fill(3)).getPublicKey();
    const groupGift = structuredClone(
      await GiftWrapFactory.create(
        ctx.sender,
        ctx.pubkey,
        WrappedMessageFactory.create([ctx.pubkey, third], "group only"),
      ),
    );
    await ctx.session.wrapped.receiver.ingest(groupGift);
    await ctx.session.wrapped.unlock(groupGift);
    expect(
      (await ctx.session.wrapped.conversation(ctx.other).getMessages({})).map((message) => message.content),
    ).toEqual(["new"]);
    expect((await ctx.session.wrapped.conversation([ctx.other, third]).getMessages({}))[0].content).toBe("group only");
    sub.unsubscribe();
    ctx.session.dispose();
    expect(ctx.eventStore.getEvent(gift.id)).toBe(gift);
    ctx.eventStore.dispose();
  });

  it("restores cached plaintext without a signer and refuses an envelope addressed to another account", async () => {
    const ctx = await setup();
    const gift = structuredClone(
      await GiftWrapFactory.create(ctx.sender, ctx.pubkey, WrappedMessageFactory.create(ctx.pubkey, "cached")),
    );
    await ctx.session.wrapped.receiver.ingest(gift);
    await ctx.session.wrapped.unlock(gift);
    ctx.session.dispose();
    const store = new EventStore();
    const options = { pubkey: ctx.pubkey, eventStore: store, pool: ctx.pool, decryptionCache: ctx.decryptionCache };
    const restored = new MessagingSession(options, {
      ...options,
      receiverOptions: { processingStore: ctx.processingStore },
    });
    const copy = JSON.parse(JSON.stringify(gift));
    await restored.wrapped.receiver.ingest(copy);
    await restored.wrapped.unlock(copy);
    expect((await restored.wrapped.conversation(ctx.other).getMessages({}))[0].content).toBe("cached");
    const foreign = await GiftWrapFactory.create(
      ctx.sender,
      ctx.other,
      WrappedMessageFactory.create(ctx.other, "private"),
    );
    await expect(restored.wrapped.receiver.ingest(foreign)).rejects.toThrow();
    restored.dispose();
    store.dispose();
    ctx.eventStore.dispose();
  });

  it("keeps failed decryptions in the SDK receiver and permits an explicit retry", async () => {
    const ctx = await setup();
    const gift = structuredClone(
      await GiftWrapFactory.create(ctx.sender, ctx.pubkey, WrappedMessageFactory.create(ctx.pubkey, "retry")),
    );
    await ctx.session.wrapped.receiver.ingest(gift);
    const decrypt = vi.spyOn(ctx.signer.nip44, "decrypt").mockRejectedValueOnce(new Error("User rejected"));
    await expect(ctx.session.wrapped.unlock(gift)).rejects.toThrow("User rejected");
    expect((await firstValueFrom(ctx.session.wrapped.decryptionState$)).failed).toContain(gift.id);
    await ctx.session.wrapped.retryDecryption(gift);
    expect((await ctx.session.wrapped.conversation(ctx.other).getMessages({}))[0].content).toBe("retry");
    decrypt.mockRestore();
    ctx.session.dispose();
    ctx.eventStore.dispose();
  });
});
