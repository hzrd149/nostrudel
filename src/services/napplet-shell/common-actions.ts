import type {
  CommonActionResult,
  CommonFollowsResult,
  CommonProfileResult,
  CommonProfileTarget,
  CommonReaction,
  CommonReportReason,
  CommonReportTarget,
} from "@napplet/core";
import { FollowUser, UnfollowUser } from "applesauce-actions/actions";
import { ReactionFactory } from "applesauce-common/factories";
import { getContacts } from "applesauce-core/helpers";
import { EventTemplate, kinds, nip19, NostrEvent } from "nostr-tools";
import { catchError, filter, firstValueFrom, Observable, of, take, timeout, toArray } from "rxjs";

import accounts from "../accounts";
import { writeEvent } from "../event-cache";
import { eventStore } from "../event-store";
import actions from "../actions";
import pool from "../pool";
import { getWriteRelays } from "./relay-tiers";

/** Resolve the first non-empty value from a reactive event-store model, or undefined on timeout. */
async function firstOrUndefined<T>(observable: Observable<T>, ms = 4000): Promise<T | undefined> {
  return firstValueFrom(
    observable.pipe(
      filter((value): value is T => value !== undefined && value !== null),
      take(1),
      timeout(ms),
      catchError(() => of(undefined)),
    ),
    { defaultValue: undefined },
  );
}

// NAP-IDENTITY read hooks resolve the *current user's* data from the event store, which
// auto-loads the backing events (kind 0 profile, kind 3 contacts) from relays on demand.
export async function getIdentityProfile(pubkey: string) {
  if (!pubkey) return null;
  const content = await firstOrUndefined(eventStore.profile(pubkey));
  if (!content) return null;

  return {
    name: content.name,
    displayName: content.display_name ?? content.displayName,
    about: content.about,
    picture: content.picture,
    banner: content.banner,
    nip05: content.nip05,
    lud16: content.lud16,
    website: content.website,
  };
}

export async function getIdentityFollows(pubkey: string) {
  if (!pubkey) return [];
  // Load the kind-3 event itself (auto-loaded from relays); the contacts model would
  // emit an empty array before the event arrives, so `take(1)` must wait on the event.
  const event = await firstOrUndefined(eventStore.replaceable({ kind: kinds.Contacts, pubkey }));
  return event ? getContacts(event).map((contact) => contact.pubkey) : [];
}

function normalizeCommonPubkey(value: string) {
  if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase();

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === "npub") return decoded.data;
    if (decoded.type === "nprofile") return decoded.data.pubkey;
  } catch {
    // handled by returning undefined below
  }
}

function normalizeCommonEventId(value: string) {
  if (/^[0-9a-f]{64}$/i.test(value)) return value.toLowerCase();

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === "note") return decoded.data;
    if (decoded.type === "nevent") return decoded.data.id;
  } catch {
    // handled by returning undefined below
  }
}

function getProfilePointer(target: CommonProfileTarget) {
  if (/^[0-9a-f]{64}$/i.test(target))
    return { pubkey: target.toLowerCase(), relays: undefined as string[] | undefined };

  try {
    const decoded = nip19.decode(target);
    if (decoded.type === "npub") return { pubkey: decoded.data, relays: undefined as string[] | undefined };
    if (decoded.type === "nprofile") return { pubkey: decoded.data.pubkey, relays: decoded.data.relays };
  } catch {
    // handled by returning undefined below
  }
}

async function publishCommonEvent(label: string, draft: EventTemplate | NostrEvent): Promise<CommonActionResult> {
  try {
    const account = accounts.active;
    if (!account) return { ok: false, error: "not-signed-in" };

    const event =
      Reflect.has(draft, "id") && Reflect.has(draft, "sig") ? (draft as NostrEvent) : await account.signEvent(draft);

    await writeEvent(event);
    eventStore.add(event);
    pool.publish(getWriteRelays(), event);

    return { ok: true, eventId: event.id, event };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getCommonProfile(target: CommonProfileTarget): Promise<CommonProfileResult> {
  const pointer = getProfilePointer(target);
  if (!pointer) return { ok: false, pubkey: "", error: "invalid-profile-target" };

  const event = await firstOrUndefined(
    eventStore.replaceable({ kind: kinds.Metadata, pubkey: pointer.pubkey, relays: pointer.relays }),
    5000,
  );
  if (!event) return { ok: true, pubkey: pointer.pubkey, profile: null };

  try {
    return { ok: true, pubkey: pointer.pubkey, profile: JSON.parse(event.content), result: { event } };
  } catch {
    return { ok: false, pubkey: pointer.pubkey, error: "invalid-profile-metadata", result: { event } };
  }
}

export async function getCommonFollows(): Promise<CommonFollowsResult> {
  const account = accounts.active;
  if (!account) return { ok: false, pubkeys: [], error: "not-signed-in" };

  return { ok: true, pubkeys: await getIdentityFollows(account.pubkey) };
}

export async function changeCommonFollow(pubkeys: string[], follow: boolean): Promise<CommonActionResult> {
  const normalized = pubkeys.map(normalizeCommonPubkey);
  if (normalized.some((pubkey) => !pubkey)) return { ok: false, error: "invalid-pubkey" };

  let result: CommonActionResult = { ok: true };
  for (const pubkey of normalized as string[]) {
    const events = await firstValueFrom(actions.exec(follow ? FollowUser : UnfollowUser, pubkey).pipe(toArray()));
    for (const event of events) {
      result = await publishCommonEvent(follow ? "Follow user" : "Unfollow user", event);
      if (!result.ok) return result;
    }
    if (!result.ok) return result;
  }

  return result;
}

export async function reactCommon(
  targetEventId: string,
  reaction: CommonReaction,
  customEmojiHref: string | undefined,
): Promise<CommonActionResult> {
  const eventId = normalizeCommonEventId(targetEventId);
  if (!eventId) return { ok: false, error: "invalid-event-id" };

  const event = await firstOrUndefined(eventStore.event(eventId), 5000);
  if (!event) return { ok: false, error: "event-not-found" };

  const emoji = customEmojiHref ? { shortcode: reaction, url: customEmojiHref } : reaction;
  const draft = await ReactionFactory.create(event, emoji as string);
  return publishCommonEvent("Reaction", draft as unknown as EventTemplate);
}

function createReportDraft(
  target: CommonReportTarget,
  reason: CommonReportReason,
  text: string,
): EventTemplate | undefined {
  if (target.type === "pubkey") {
    const pubkey = normalizeCommonPubkey(target.pubkey);
    if (!pubkey) return;
    return {
      kind: kinds.Report,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", pubkey, reason]],
      content: text,
    };
  }

  const eventId = normalizeCommonEventId(target.id);
  if (!eventId) return;

  const tags = [["e", eventId, reason]];
  const pubkey = target.pubkey && normalizeCommonPubkey(target.pubkey);
  if (pubkey) tags.push(["p", pubkey]);
  return { kind: kinds.Report, created_at: Math.floor(Date.now() / 1000), tags, content: text };
}

export function reportCommon(target: CommonReportTarget, reason: CommonReportReason, text: string) {
  const draft = createReportDraft(target, reason, text);
  if (!draft) return Promise.resolve({ ok: false, error: "invalid-report-target" });
  return publishCommonEvent("Report", draft);
}
