import { EventStore } from "applesauce-core";
import { COMMENT_KIND, MutedThings } from "applesauce-common/helpers";
import { finalizeEvent, getPublicKey, kinds, nip19, NostrEvent } from "nostr-tools";
import { BehaviorSubject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { observeNotifications } from "./notification-query";
import { getSocialNotifications, SOCIAL_NOTIFICATION_KINDS, SocialNotifications } from "./nostr/notifications";
import { getRepostGroups, getZapGroups } from "./nostr/notification-groups";

const ownKey = new Uint8Array(32).fill(1);
const otherKey = new Uint8Array(32).fill(2);
const user = getPublicKey(ownKey);
const other = getPublicKey(otherKey);
const emptyMutes = (): MutedThings => ({
  pubkeys: new Set(),
  threads: new Set(),
  hashtags: new Set(),
  words: new Set(),
});

function note(tags: string[][] = [], key = otherKey, created_at = 100, kind = 1, content = "") {
  return finalizeEvent({ kind, content, tags, created_at }, key);
}

function setup() {
  const store = new EventStore();
  const mutes = new BehaviorSubject<MutedThings | undefined>(undefined);
  const project = vi.fn((events: NostrEvent[], muted: MutedThings | undefined) =>
    getSocialNotifications(events, user, muted),
  );
  const results: SocialNotifications[] = [];
  const subscription = observeNotifications(
    store,
    [{ kinds: SOCIAL_NOTIFICATION_KINDS, "#p": [user] }, { authors: [user] }],
    mutes,
    project,
  ).subscribe((value) => results.push(value));
  return { store, mutes, project, results, subscription };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("notification store projections", () => {
  it.each([true, false])("keeps every reply with parents arriving first=%s", async (parentsFirst) => {
    const ctx = setup();
    const first = note([], ownKey, 1);
    const second = note([], ownKey, 2);
    const replies = [first, second].map((parent, index) =>
      note(
        [
          ["p", user],
          ["e", parent.id, "", "reply"],
        ],
        otherKey,
        100 + index,
      ),
    );
    if (parentsFirst) [first, second].forEach((event) => ctx.store.add(event));
    replies.forEach((event) => ctx.store.add(event));
    await vi.advanceTimersByTimeAsync(100);
    if (!parentsFirst) {
      expect(ctx.results.at(-1)?.replies).toHaveLength(0);
      [first, second].forEach((event) => ctx.store.add(event));
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(ctx.results.at(-1)?.replies.map((event) => event.id)).toEqual(replies.toReversed().map((event) => event.id));
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("classifies NIP-22 event and address parents and NIP-10 author hints without history", async () => {
    const ctx = setup();
    const parent = note([], ownKey, 1);
    const article = `30023:${user}:article`;
    const nip10 = note(
      [
        ["p", user],
        ["e", parent.id, "", "reply", user],
      ],
      otherKey,
      100,
    );
    const nip22 = note(
      [
        ["p", user],
        ["E", parent.id, "", user],
        ["K", "1"],
        ["e", parent.id, "", user],
        ["k", "1"],
      ],
      otherKey,
      101,
      COMMENT_KIND,
    );
    const address = note(
      [
        ["p", user],
        ["A", article],
        ["K", "30023"],
        ["a", article],
        ["k", "30023"],
      ],
      otherKey,
      102,
      COMMENT_KIND,
    );
    [nip10, nip22, address].forEach((event) => ctx.store.add(event));
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.replies.map((event) => event.id)).toEqual([address.id, nip22.id, nip10.id]);
    expect(ctx.results.at(-1)?.threads.map((thread) => thread.data.key)).toContain(`a:${article}`);
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("reclassifies earlier quotes when their parent arrives and distinguishes content mentions from p tags", async () => {
    const ctx = setup();
    const parent = note([], ownKey, 1);
    const quote = note(
      [
        ["p", user],
        ["q", parent.id],
      ],
      otherKey,
      100,
    );
    const mention = note([["p", user]], otherKey, 101, 1, `hello nostr:${nip19.npubEncode(user)}`);
    const tagOnly = note([["p", user]], otherKey, 102);
    [quote, mention, tagOnly].forEach((event) => ctx.store.add(event));
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.quotes).toHaveLength(0);
    ctx.store.add(parent);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.quotes.map((event) => event.id)).toEqual([quote.id]);
    expect(ctx.results.at(-1)?.mentions.map((event) => event.id)).toEqual([mention.id]);
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("batches expensive projections without dropping events and emits the final burst", async () => {
    const ctx = setup();
    const parent = note([], ownKey, 1);
    ctx.store.add(parent);
    const replies = Array.from({ length: 200 }, (_, index) =>
      note(
        [
          ["p", user],
          ["e", parent.id, "", "reply"],
        ],
        otherKey,
        100 + index,
      ),
    );
    replies.forEach((event) => ctx.store.add(event));
    expect(ctx.project).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.project).toHaveBeenCalledTimes(1);
    expect(ctx.results.at(-1)?.replies).toHaveLength(200);
    ctx.store.add(replies[0]);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.replies).toHaveLength(200);
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("applies mute/unmute updates and removes deleted events and empty groups", async () => {
    const ctx = setup();
    const parent = note([], ownKey, 1);
    const reply = note([
      ["p", user],
      ["e", parent.id, "", "reply"],
    ]);
    ctx.store.add(parent);
    ctx.store.add(reply);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.threads).toHaveLength(1);
    ctx.mutes.next({ ...emptyMutes(), pubkeys: new Set([other]) });
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.replies).toHaveLength(0);
    expect(ctx.results.at(-1)?.threads).toHaveLength(0);
    ctx.mutes.next(emptyMutes());
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.replies).toHaveLength(1);
    const deletion = note([["e", reply.id]], otherKey, 200, kinds.EventDeletion);
    ctx.store.add(deletion);
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.replies).toHaveLength(0);
    expect(ctx.results.at(-1)?.threads).toHaveLength(0);
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("replaces addressable mention versions and ignores the user's own events", async () => {
    const ctx = setup();
    const tags = [
      ["d", "article"],
      ["p", user],
    ];
    const older = note(tags, otherKey, 100, kinds.LongFormArticle, `nostr:${nip19.npubEncode(user)}`);
    const newer = note(tags, otherKey, 101, kinds.LongFormArticle, `new nostr:${nip19.npubEncode(user)}`);
    ctx.store.add(older);
    await vi.advanceTimersByTimeAsync(100);
    ctx.store.add(newer);
    ctx.store.add(note([["p", user]], ownKey, 102, 1, `nostr:${nip19.npubEncode(user)}`));
    await vi.advanceTimersByTimeAsync(100);
    expect(ctx.results.at(-1)?.mentions.map((event) => event.id)).toEqual([newer.id]);
    ctx.subscription.unsubscribe();
    ctx.store.dispose();
  });

  it("groups repost snapshots in descending order with independent immutable results", () => {
    const root = note([], ownKey, 1);
    const a = note(
      [
        ["e", root.id],
        ["p", user],
      ],
      otherKey,
      100,
      kinds.Repost,
    );
    const b = note(
      [
        ["e", root.id],
        ["p", user],
      ],
      otherKey,
      101,
      kinds.Repost,
    );
    const before = getRepostGroups([a], user);
    const after = getRepostGroups([b, a], user);
    expect(before[0].events).toHaveLength(1);
    expect(after[0].events.map((event) => event.id)).toEqual([b.id, a.id]);
    expect(after[0].latest).toBe(101);
    expect(getRepostGroups([b, a], user, { ...emptyMutes(), pubkeys: new Set([other]) })).toHaveLength(0);
  });

  it("updates zap groups on deletion and filters muted senders rather than receipt signers", async () => {
    const store = new EventStore();
    const invoice =
      "lnbc100n1p5pjxjk9qypqqqdqqxqrrsssp54ttukd5xxy2nmdzf864yjereuf9v3pyzl66hpqgxa0e8fvlzf6aspp5z6twjtwde82ec7wfcqw2m63v48r6fyw78753wxh7zjlvuru7tapsp6c9lq6m4d55u9jkxuqpepdknnzznfu05wl73swyn52z3pnkzyxrlkqf3t5jkw2hq7ukasuh5wgazvfwkkzrf0aqk4k0zluzu4rx8wqq8sut0l";
    const parent = note([], ownKey, 1);
    const request = note(
      [
        ["p", user],
        ["e", parent.id],
        ["relays", "wss://fixture.test/"],
      ],
      otherKey,
      90,
      9734,
    );
    const tags = [
      ["p", user],
      ["e", parent.id],
      ["description", JSON.stringify(request)],
      ["bolt11", invoice],
    ];
    const signer = new Uint8Array(32).fill(3);
    const older = note(tags, signer, 100, 9735);
    const newer = note(tags, signer, 110, 9735);
    const mutes = new BehaviorSubject<MutedThings | undefined>(undefined);
    const results: ReturnType<typeof getZapGroups>[] = [];
    const subscription = observeNotifications(store, [{ kinds: [9735], "#p": [user] }], mutes, (events, mutes) =>
      getZapGroups(events, user, mutes),
    ).subscribe((groups) => results.push(groups));
    store.add(older);
    store.add(newer);
    store.add(note([["p", user]], signer, 111, 9735));
    await vi.advanceTimersByTimeAsync(100);
    expect(results.at(-1)?.[0].events.map((event) => event.id)).toEqual([newer.id, older.id]);
    mutes.next({ ...emptyMutes(), pubkeys: new Set([other]) });
    await vi.advanceTimersByTimeAsync(100);
    expect(results.at(-1)).toHaveLength(0);
    mutes.next(undefined);
    store.add(note([["e", newer.id]], signer, 120, 5));
    await vi.advanceTimersByTimeAsync(100);
    expect(results.at(-1)?.[0].latest).toBe(100);
    expect(results.at(-1)?.[0].events).toHaveLength(1);
    subscription.unsubscribe();
    store.dispose();
  });
});
