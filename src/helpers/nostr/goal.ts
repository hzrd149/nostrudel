import {
  DecodeResult,
  getAddressPointerFromATag,
  getEventPointerFromETag,
  getProfilePointerFromPTag,
  isRTag,
} from "applesauce-core/helpers";
import dayjs from "dayjs";
import { kinds, NostrEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";

/** @deprecated */
export function getPointerFromTag(tag: string[]): ReturnType<typeof decode> | null {
  try {
    switch (tag[0]) {
      case "e":
        return { type: "nevent", data: getEventPointerFromETag(tag) };

      case "a":
        return {
          type: "naddr",
          data: getAddressPointerFromATag(tag),
        };

      case "p":
        return { type: "nprofile", data: getProfilePointerFromPTag(tag) };

      // NIP-18 quote tags
      case "q":
        return { type: "nevent", data: getEventPointerFromETag(tag) };
    }
  } catch (error) {}

  return null;
}

/** @deprecated use kinds.ZapGoal */
export const GOAL_KIND = kinds.ZapGoal;

export type ParsedGoal = {
  event: NostrEvent;
  author: string;
  amount: number;
  relays: string[];
};

export function getGoalPointerFromEvent(event: NostrEvent) {
  const tag = event.tags.find((t) => t[0] === "goal");
  const id = tag?.[1];
  const relay = tag?.[2];
  return id ? { id, relay } : undefined;
}

export function getGoalName(goal: NostrEvent) {
  return goal.content;
}
export function getGoalRelays(goal: NostrEvent) {
  const relays = goal.tags.find((t) => t[0] === "relays");
  return relays ? relays.slice(1) : [];
}
export function getGoalAmount(goal: NostrEvent) {
  const amount = goal.tags.find((t) => t[0] === "amount")?.[1];
  if (amount === undefined) throw new Error("Missing amount");
  const int = parseInt(amount);
  if (!Number.isFinite(int)) throw new Error("Amount not a number");
  if (int <= 0) throw new Error("Amount less than or equal to zero");
  return int;
}
export function getGoalClosedDate(goal: NostrEvent) {
  const value = goal.tags.find((t) => t[0] === "closed_at")?.[1];
  if (value === undefined) return;
  const date = dayjs.unix(parseInt(value));
  if (!date.isValid) throw new Error("Invalid date");
  return date.unix();
}

export function getGoalLinks(goal: NostrEvent) {
  return goal.tags.filter(isRTag).map((t) => t[1]);
}
export function getGoalEventPointers(goal: NostrEvent) {
  const pointers: DecodeResult[] = [];

  for (const tag of goal.tags) {
    const decoded = getPointerFromTag(tag);

    if (decoded?.type === "naddr" || decoded?.type === "nevent") {
      pointers.push(decoded);
    }
  }

  return pointers;
}

export function validateGoal(goal: NostrEvent) {
  getGoalAmount(goal);
  const relays = getGoalRelays(goal);
  if (relays.length) throw new Error("zero relays");
  return true;
}

export function safeValidateGoal(goal: NostrEvent) {
  try {
    return validateGoal(goal);
  } catch (e) {}
  return false;
}

export function getGoalTag(goal: NostrEvent, relay?: string) {
  const id = goal.id;
  return ["goal", id, relay].filter(Boolean);
}
