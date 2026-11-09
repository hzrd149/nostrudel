import "fake-indexeddb/auto";
import { GiftWrapFactory, WrappedMessageFactory } from "applesauce-common/factories";
import { EventStore } from "applesauce-core";
import { RelayPool } from "applesauce-relay";
import { PrivateKeySigner } from "applesauce-signers";
import { openDB } from "idb";
import { describe, expect, it, vi } from "vitest";
import { MessagingSession } from "./session";
import { openMessagingResources } from "./resources";
import { openMessageCipher } from "./storage";
import { RumorDatabase } from "./rumor-database";

function cache() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("durable messaging resources", () => {
  it("restores indexes, rumors, checkpoints, and file/reply drafts offline without decrypting envelopes again", async () => {
    const signer = new PrivateKeySigner(new Uint8Array(32).fill(11));
    const sender = new PrivateKeySigner(new Uint8Array(32).fill(12));
    const pubkey = await signer.getPublicKey();
    const other = await sender.getPublicKey();
    const storage = cache();
    const pool = new RelayPool();
    const store = new EventStore();
    const resources = await openMessagingResources(storage, pubkey, new AbortController().signal);
    const options = { pubkey, signer, pool, eventStore: store, decryptionCache: storage };
    const session = new MessagingSession(
      { ...options, conversationIndex: resources.legacyIndex },
      {
        ...options,
        rumorStore: resources.rumorStore,
        conversationIndex: resources.wrappedIndex,
        receiverOptions: { processingStore: resources.processingStore },
        draftStorage: resources.wrappedDrafts.strings,
        draftFileStorage: resources.wrappedDrafts.files,
      },
    );
    const gift = structuredClone(
      await GiftWrapFactory.create(sender, pubkey, WrappedMessageFactory.create(pubkey, "private durable rumor")),
    );
    await session.wrapped.receiver.ingest(gift);
    await session.wrapped.unlock(gift);
    await session.wrapped.indexConversations();
    const conversation = session.wrapped.conversation(other);
    const [rumor] = await conversation.getMessages({});
    await conversation.setDraft({
      content: "private draft",
      replyTo: rumor.id,
      files: [new File(["secret file bytes"], "secret.txt", { type: "text/plain" })],
    });
    const legacy = await sender.signEvent({
      kind: 4,
      created_at: 1,
      tags: [["p", pubkey]],
      content: await sender.nip04.encrypt(pubkey, "legacy"),
    });
    store.add(legacy);
    await session.legacy.indexConversations();
    await expect.poll(() => resources.legacyIndex.get(conversation.id)).toBeDefined();
    const checkpoints = [];
    for await (const record of await resources.processingStore.list()) checkpoints.push(record);
    expect(checkpoints.some((record) => record.status === "completed")).toBe(true);

    const { namespace } = await openMessageCipher(storage, pubkey);
    const raw = await openDB(`message-rumors:${namespace}`);
    const records = await raw.getAll("rumors");
    expect(records[0].content).toBeUndefined();
    expect(JSON.stringify(records)).not.toContain("private durable rumor");
    raw.close();
    session.dispose();
    resources.close();
    store.dispose();

    const reopened = await openMessagingResources(storage, pubkey, new AbortController().signal);
    const fresh = new EventStore();
    const decrypt = vi
      .spyOn(signer.nip44, "decrypt")
      .mockRejectedValue(new Error("Signer must not be used during restore"));
    const restoredOptions = { pubkey, signer, pool, eventStore: fresh };
    const restored = new MessagingSession(
      { ...restoredOptions, conversationIndex: reopened.legacyIndex },
      {
        ...restoredOptions,
        rumorStore: reopened.rumorStore,
        conversationIndex: reopened.wrappedIndex,
        receiverOptions: { processingStore: reopened.processingStore },
        draftStorage: reopened.wrappedDrafts.strings,
        draftFileStorage: reopened.wrappedDrafts.files,
      },
    );
    await restored.pages.load();
    expect(restored.pages.rows$.value[0].lastMessage?.content).toBe("private durable rumor");
    const restoredConversation = restored.wrapped.conversation(other);
    expect((await restoredConversation.getMessages({}))[0].id).toBe(rumor.id);
    const draft = await restoredConversation.loadDraft();
    expect(draft?.content).toBe("private draft");
    expect(draft?.replyTo).toBe(rumor.id);
    expect(await draft?.files?.[0].text()).toBe("secret file bytes");
    const restoredGift = structuredClone(gift);
    await restored.wrapped.receiver.ingest(restoredGift);
    await restored.wrapped.unlock(restoredGift);
    expect(decrypt).not.toHaveBeenCalled();
    expect(fresh.getEvent(rumor.id)).toBeUndefined();
    restored.dispose();
    reopened.close();
    fresh.dispose();
  });

  it("closes resources when account cancellation wins an asynchronous database open", async () => {
    const controller = new AbortController();
    const storage = cache();
    const original = RumorDatabase.open;
    let release!: () => void;
    let opened!: () => void;
    let close: ReturnType<typeof vi.spyOn>;
    const ready = new Promise<void>((resolve) => {
      opened = resolve;
    });
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(RumorDatabase, "open").mockImplementationOnce(async (...args) => {
      const database = await original(...args);
      close = vi.spyOn(database, "close");
      opened();
      await blocked;
      return database;
    });
    const opening = openMessagingResources(storage, "cancelled-account", controller.signal);
    await ready;
    controller.abort();
    release();
    await expect(opening).rejects.toThrow();
    expect(close!).toHaveBeenCalledTimes(1);
    // A subsequent open must not be blocked by the cancelled generation.
    const resources = await openMessagingResources(storage, "cancelled-account", new AbortController().signal);
    resources.close();
  });
});
