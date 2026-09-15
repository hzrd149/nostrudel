# Phase 4: Dead code and import hygiene sweep - Pattern Map

**Mapped:** 2026-09-15
**Mode:** No new files — this phase modifies existing files only. Mapping is remedy-shape →
closest in-repo instance of that shape, not new-file → analog.
**Remedy shapes analyzed:** 6 (bare catch, `_`-prefix param, rule-scoped ignore, dead-declaration
deletion, useState-tuple deletion, hook-return-value deletion)
**High-concentration files cross-referenced:** 4

## Remedy-Shape Classification

| Remedy Shape | Decision | Role | Data Flow | Closest In-Repo Instance | Match Quality |
|---|---|---|---|---|---|
| Bare `catch {` | D-05 | error-handling / utility | transform | `src/helpers/nip19.ts:11-14` | exact (Phase 3-established shape) |
| `_`-prefix unused param | D-06 | callback signature | event-driven/transform | none found | **no analog — this phase introduces the convention** |
| Rule-scoped ignore (file-level) | D-08 | module-level directive | — | `src/sw/client/error-logger.ts:1` | exact |
| Rule-scoped ignore (next-line) | D-08 | statement-level directive | — | `src/hooks/timeline/use-timeline-cache-key.ts:14-15` | exact |
| Dead declaration deletion (plain local var) | D-07 | local variable | — | `src/services/sqlite/index.ts:43` `const dbName` (in-scope target itself; shape = unused const before a call) | exact |
| `useState` tuple, only setter dead | D-07 (Pitfall 4) | component state | CRUD-local | `src/views/feeds/dvm/feed.tsx:78` (in-scope target; no *other* instance of this shape exists in-repo to copy from — treat the RESEARCH.md before/after as the pattern) | no independent analog — follow RESEARCH.md Code Example |
| Unused hook-return-value deletion | D-07 (Pitfall 3) | reactive hook call | event-driven (EventStore subscription) | `src/views/messages/index.tsx:170-171` (`autoDecryptMessages`, `locked` — in-scope targets themselves; shape = `useEventModel`/`use$` call whose binding is unused but the call must stay) | no independent analog — same caution applies to `src/views/messages/group/index.tsx:86` and `src/views/user/tabs/lists.tsx:23` |
| Redundant trailing `return false;` after try/catch | D-13 | control flow | transform | `src/helpers/nostr/goal.ts:107-113` (the target itself; identical shape repeated at `content/transform/nip-notation.ts:47`, `content/transform/bip-notation.ts:47`) | exact (3 near-identical sites, use one as template for the other two) |

## Pattern Assignments

### D-05: Bare `catch {` (24 sites)

**Analog:** `src/helpers/nip19.ts:9-14` (already bare, Phase 3 D-06 output — use as the target
shape, not a "before" example)

```typescript
// src/helpers/nip19.ts:9-14 — the established AFTER shape
    return result;
  } catch {
    // Not a decodable nip19 string; normalizeToHexPubkey treats a falsy result as "not decodable"
    return undefined;
  }
```

Other current bare-catch files confirming the same shape is already project-idiom:
`src/helpers/parse.ts`, `src/helpers/nostr/dms.ts`, `src/helpers/nostr/goal.ts`,
`src/helpers/nostr/webxdc.ts`. Apply the same transform to each of the 24 D-05 sites: drop the
caught binding, keep a short comment explaining why the failure is swallowed (per `AGENTS.md` §
Swallowed Exceptions), do not leave the block literally empty (triggers `eslint/no-empty`
independent of D-05).

---

### D-06: `_`-prefix contract-bound unused params (57 sites)

**No in-repo analog exists.** A repo-wide grep for an existing `_`-prefixed parameter
(`(param, _param2`-style) returned zero hits. **This phase introduces the convention** — the
planner should tell the executor there is no precedent to copy from in-repo; the shape comes
directly from the ESLint message itself and RESEARCH.md's Code Examples section:

```typescript
// Before — lint message: "Unused parameters should start with a '_'"
items.map((item, index) => renderItem(item))

// After (contract-bound: positional callback, can't just drop the param)
items.map((item, _index) => renderItem(item))

// Before — trailing param, no caller passes a 2nd arg
function handler(event: Event, unusedContext: Context) { ... }

// After (freely deletable — verify no caller passes it first)
function handler(event: Event) { ... }
```

**High-concentration file:** `src/components/markdown/markdown.tsx` carries 10 of the 57 findings.
Its renderer-component signatures follow this consistent shape (lines 42-60 shown; same pattern
repeats through the file for `H1`/`H2`/`H3`/etc.):

```typescript
// src/components/markdown/markdown.tsx:42-48
function H1({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h1" size="2xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
```

Here `node` is destructured from `react-markdown`'s `Components` contract but unused in the body —
this is the contract-bound case (`_`-prefix: `{ children, node: _node, ...props }`, or omit `node`
from destructuring entirely and let it flow into `...props` if that doesn't break typing — verify
per-site per RESEARCH.md's Open Question 1, do not batch-apply one remedy to the whole file).

---

### D-08 / D-09 / D-10 / D-11: Rule-scoped ignores

**File-level analog:** `src/sw/client/error-logger.ts:1`
```typescript
// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
```

**Next-line analog:** `src/hooks/timeline/use-timeline-cache-key.ts:14-15`
```typescript
  // aislop-ignore-next-line ai-slop/hidden-fallback -- fallback is a stable nanoid from useMemo serving the first render until the effect above writes it into route state; this is initialization, not error recovery, so there is no failure path to make explicit
  return cacheKey || fallback;
```

**Placement distinction for the planner:**
- `aislop-ignore-file <rule> -- <reason>` — first line of file, suppresses the rule for the whole
  file (use for `magic-textarea.tsx`'s D-10 case if the whole file has only that one finding, or
  scope to `-line`/`-next-line` if the file has other unrelated findings — check at execution
  time).
- `aislop-ignore-next-line <rule> -- <reason>` — sits on the line immediately above the flagged
  line (used above; matches D-11's `formState.isDirty;` case, where the ignore comment goes
  directly above the property-read statement).
- A bare `-line` variant (same line as the finding, trailing comment) is also valid per
  `AGENTS.md` § Inline ignores but has no in-repo instance found this session — prefer
  `-next-line` above a standalone statement (as both examples above do) unless the finding is on a
  line too long to comfortably append a trailing comment.

**D-09 target:** `src/services/sqlite/index.ts:7-16` — apply an `aislop-ignore-next-line` (or a
short ignore block) to the `no-unreachable`/`unreachable-code` lines below the `throw`, e.g.:
```typescript
// src/services/sqlite/index.ts:6-16 (current)
// Setup hacky web sqlite
if (CAP_IS_WEB) {
  throw new Error("Do not load the sqlite module on web, it does not work because jeep-sqlite can not be disabled");
  const { JeepSqlite } = await import("jeep-sqlite/dist/components/jeep-sqlite");
  customElements.define("jeep-sqlite", JeepSqlite);
  const jeepEl = document.createElement("jeep-sqlite");
  document.body.appendChild(jeepEl);
  await customElements.whenDefined("jeep-sqlite");
  await sqlite.initWebStore();
}
```
Note line 43 (`const dbName = db.getConnectionDBName();` inside `deleteDatabase`) is a **separate,
genuinely dead** local variable in the same file — delete it under D-07, do not fold it into this
ignore (D-09 explicitly carves it out).

---

### D-07: Dead declaration deletion (24 sites) + D-13 residue (3 sites)

**Plain dead local/declaration — standard shape:** any of the 18 flagged locals (e.g.
`src/services/sqlite/index.ts:43`, `src/services/wallets.ts:33-34`
`SUGGESTED_MINTS`/`DEFAULT_WALLET_RELAYS`, `src/views/lists/list/follow-set.tsx:42`
`ListFeedButton`) — delete the whole declaration; `pnpm build` + `grep -rn "<name>" src/` is the
backstop, per RESEARCH.md's Don't Hand-Roll table.

`src/views/lists/list/follow-set.tsx:42-55` (dead `ListFeedButton`, confirmed by RESEARCH.md to
occupy a disjoint line range from Wave 1's ~8 unused-import deletions in the same file):
```typescript
function ListFeedButton({ list, ...props }: { list: NostrEvent } & Omit<ButtonProps, "children">) {
  const address = getReplaceableAddress(list);
  if (!address) return null; // v5: can return null
  return (
    <Button as={RouterLink} to={{ pathname: "/", search: new URLSearchParams({ people: address }).toString() }} {...props}>
      View Feed
    </Button>
  );
}
```

`src/services/wallets.ts:32-34` (dead config constants, delete both lines and the preceding
comment):
```typescript
// Suggested mints + relays used when creating a brand new NIP-60 wallet (setup flow, not built yet)
const SUGGESTED_MINTS = ["https://mint.minibits.cash/Bitcoin", "https://21mint.me"];
const DEFAULT_WALLET_RELAYS = ["wss://nos.lol", "wss://relay.primal.net"];
```
Caution: this file is also Wave 1's D-03 auto-fix target (import merge at lines 1-2). Sequence
this deletion in a later wave, after the import merge has already landed — RESEARCH.md confirms
disjoint line ranges so no conflict, but ordering avoids touching the file twice in one commit.

**`useState` tuple, only setter dead — special shape, no in-repo precedent to copy, follow this
exact transform:**
```typescript
// src/views/feeds/dvm/feed.tsx:78 — BEFORE
const [params, setParams] = useState<Record<string, string>>({});
// params IS used at line 83: Object.entries(params)

// AFTER — drop only the unused second destructured element
const [params] = useState<Record<string, string>>({});
```
Do not delete the whole line — `params` is live (used at `feed.tsx:83`,
`Object.entries(params).map(...)`).

**Unused hook-return-value — special shape, verify side-effect-free before deleting the call:**
```typescript
// src/views/messages/index.tsx:169-171 — BEFORE
// Automatically decrypt new wrapped messages
const autoDecryptMessages = use$(localSettings.autoDecryptMessages);
const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);
```
Both bindings are unused. Per RESEARCH.md Pitfall 3, `useEventModel` is a reactive EventStore
query (no independent side effect), so deleting the whole statement is expected to be safe — but
this is a hook call, not a pure expression, so confirm no side effect is relied on before deleting
(or prefix the binding with `_` instead of deleting the call, as RESEARCH.md's fallback suggests,
and surface that deviation in the plan/summary). Same shape and same caution apply to
`src/views/messages/group/index.tsx:86` (`locked`) and `src/views/user/tabs/lists.tsx:23`
(`muted`).

**D-13 redundant trailing `return false;`:**
```typescript
// src/helpers/nostr/goal.ts:107-113 — current (unreachable line 113)
export function safeValidateGoal(goal: NostrEvent) {
  try {
    return validateGoal(goal);
  } catch {
    // Goal event failed validation; callers filter it out
    return false;
  }
  return false; // <-- unreachable, delete this line only
}
```
Identical shape (array-callback try/catch) at `src/components/content/transform/nip-notation.ts:47`
and `src/components/content/transform/bip-notation.ts:47` — use `goal.ts` as the template for all
three; keep the in-catch `return false;` (satisfies error-severity `ai-slop/swallowed-exception`),
delete only the trailing one after the try/catch block closes.

---

### D-12: `cleanup;` bug fix

`src/components/pow/mine-pow.tsx:47` — change bare identifier reference `cleanup;` to a call
`cleanup();` and correct the duplicated comment. RESEARCH.md confirmed `cleanup` is declared at
line 61 (`const cleanup: MinerCleanup = () => {...}`) and is only referenced inside an async
`onmessage` callback, so it is out of TDZ and safely callable at line 47 — no analog needed, this
is a one-off targeted fix.

### D-12a: short-circuit → `if` statement

`src/components/content/components/gallery.tsx:24` and `src/components/content/links/image.tsx:67`
— both currently read `!e.isPropagationStopped() && show();`. Rewrite as:
```typescript
if (!e.isPropagationStopped()) show();
```
No ignore needed; the two sites are near-identical, use either as the template for the other.

---

## Shared Patterns

### Import-hygiene auto-fix (D-03/D-04, Wave 1 only)
**Source:** `aislop fix --safe .` output, verified empirically in RESEARCH.md's Auto-Fix Mechanics
section — no hand-written excerpt needed; this is tool output, not a copyable code pattern. Apply
to all 57 (unused-import) + 44 (duplicate-import) files in one commit, then:
- `git checkout -- <file>` for the 5 comment-only-diff files + `src/lib/qrcodegen.ts`
- hand-restore only the 6 narrative-comment banner lines in `src/services/wallets.ts` (keep its
  import merge at lines 1-2 shown above)

### Rule-scoped ignore format (applies to D-08 through D-11)
**Source:** `src/sw/client/error-logger.ts:1` and `src/hooks/timeline/use-timeline-cache-key.ts:14`
(both quoted above in full). Format: `aislop-ignore-file|line|next-line <rule-name> -- <reason>`.
Apply verbatim format to all 4 deliberate-exception sites (D-09 sqlite, D-10 magic-textarea, D-11
×2 formState.isDirty).

### Bare-catch format (applies to all 24 D-05 sites)
**Source:** `src/helpers/nip19.ts:11-14` (quoted above). Continues Phase 3's established pattern,
already documented in `AGENTS.md` § Swallowed Exceptions — no new convention, just wider
application.

## High-Concentration Files Requiring Cross-Wave Sequencing

| File | Decision categories touching it | Sequencing note |
|---|---|---|
| `src/services/sqlite/index.ts` | D-09 (ignore, lines 7-16) + D-07 (delete `dbName`, line 43) | Disjoint ranges; either same-wave or split, no conflict, per RESEARCH.md |
| `src/services/wallets.ts` | D-03 (import merge, Wave 1) + D-07 (delete constants, lines 33-34, later wave) | Must land in different waves — Wave 1 first |
| `src/views/lists/list/follow-set.tsx` | D-03 (~8 unused-import deletions, Wave 1) + D-07 (delete `ListFeedButton`, line 42) | Disjoint ranges confirmed; Wave 1 first |
| `src/components/markdown/markdown.tsx` | D-06 only (10 of 57 unused-param sites) | Single decision category but needs per-site (not per-file) judgment — see D-06 section above |

## No Analog Found

| Remedy Shape | Reason |
|---|---|
| `_`-prefix unused parameter (D-06) | Zero existing `_`-prefixed parameters found repo-wide; this phase originates the convention. Executor should not search further for a copy-from site — use the ESLint message + RESEARCH.md Code Examples as the spec instead. |
| `useState` tuple with dead setter (D-07 Pitfall 4) | Only one instance in the codebase (`views/feeds/dvm/feed.tsx:78`), and it is itself a phase target, not a pre-existing analog. Treat the before/after shown above as the spec. |
| Rule-scoped `-line` (same-line trailing) ignore variant | Neither of the two in-repo ignore instances uses this placement (both use `-file` or `-next-line`); if a D-08 site needs same-line placement, there is no in-repo precedent — follow `AGENTS.md` § Inline ignores' documented syntax directly. |

## Metadata

**Analog search scope:** `src/` (whole tree), targeted greps for `} catch {`, `_`-prefixed params,
`aislop-ignore`, plus direct reads of every file named in D-07 through D-13.
**Files scanned:** 13 (analogs) + all in-scope D-07/D-08/D-09/D-13 targets read directly
**Pattern extraction date:** 2026-09-15
