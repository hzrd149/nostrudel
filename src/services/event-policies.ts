import { isTTag } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-social-graph";
import { socialGraph$ } from "./social-graph";

/** Common properties for all rules */
export type PolicyRuleCommon = {
  disabled?: boolean;
};

export type SocialGraphDistanceRule = PolicyRuleCommon & {
  type: "social-graph-distance";
  distance: number; // 0 is only self, 1 is friends, 2 is friends of friends, etc.
};

/** Rule for maximum number of hashtags */
export type MaxHashtagsRule = PolicyRuleCommon & {
  type: "max-hashtags";
  max: number;
};

/** Rule to filter out muted words */
export type HideWordsRule = PolicyRuleCommon & {
  type: "hide-words";
  words: string[];
};

/** Rule to filter out muted hashtags */
export type HideHashtagsRule = PolicyRuleCommon & {
  type: "hide-hashtags";
  hashtags: string[];
};

/** All types of rules */
export type EventPolicyRule = SocialGraphDistanceRule | MaxHashtagsRule | HideWordsRule | HideHashtagsRule;

/** A handler function for applying a rule to an event */
export type RuleHandler<Rule extends unknown> = (event: NostrEvent, rule: Rule) => string | undefined;

/** Which rule is violated and why */
export type RuleViolation = {
  rule: EventPolicyRule;
  message: string;
};

/** A collection of rules */
export type EventPolicies = EventPolicyRule[];

// Global directory of handlers
const handlers = new Map<string, RuleHandler<any>>();
function registerHandler<Rule extends unknown>(type: EventPolicyRule["type"], handler: RuleHandler<Rule>) {
  handlers.set(type, handler);
}

/** Check if a event violates any rules */
export function getViolations(event: NostrEvent, rules: EventPolicyRule[]): RuleViolation[] {
  const violations: RuleViolation[] = [];
  for (const rule of rules) {
    // Skip if disabled
    if (rule.disabled) continue;

    const handler = handlers.get(rule.type);
    if (!handler) continue;

    const violation = handler(event, rule);
    if (violation) violations.push({ rule, message: violation });
  }
  return violations;
}

// Register handlers
let graph = socialGraph$.value;
registerHandler<SocialGraphDistanceRule>("social-graph-distance", (event, rule) => {
  if (rule.distance === 0 && event.pubkey !== graph.getRoot()) return "Author is not user";

  const distance = graph.getFollowDistance(event.pubkey);
  if (distance > rule.distance) return "Author is not in your social graph";
});

registerHandler<MaxHashtagsRule>("max-hashtags", (event, rule) => {
  const hashtags = event.tags.filter(isTTag);
  if (hashtags.length > rule.max) return "Event has too many hashtags";
});
registerHandler<HideWordsRule>("hide-words", (event, rule) => {
  const text = event.content;
  if (rule.words.some((word) => text.includes(word))) return "Event contains hidden word";
});

registerHandler<HideHashtagsRule>("hide-hashtags", (event, rule) => {
  const hashtags = event.tags.filter(isTTag).map((t) => t[1]);
  if (hashtags.some((hashtag) => rule.hashtags.includes(hashtag))) return "Event contains hidden hashtag";
});
