# Phase 1: Hidden mutes support with unlock UX and decryption cache - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-06
**Phase:** 1-hidden-mutes-support-with-unlock-ux-and-decryption-cache
**Areas discussed:** Unlock trigger, Muted view presentation, Locked-state behavior, Write path

---

## Area selection

All four proposed gray areas were selected for discussion.

| Option | Description | Selected |
|--------|-------------|----------|
| Unlock trigger | What causes hidden mutes to decrypt; behaviour on cache miss | ✓ |
| Muted view presentation | How private entries appear in `views/lists/muted` | ✓ |
| Locked-state behavior | Silent under-filtering; disabled/locked decryption cache | ✓ |
| Write path (mute/unmute private) | Unmute silently no-ops on private entries today | ✓ |

---

## Unlock trigger

### Q1 — What should trigger the decryption of the hidden mute entries?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto on load, via existing fallback | Extend `autoDecryptMessagesFallback` to handle kind 10000; almost no new code, but a signer prompt at startup | |
| Explicit unlock action only | No automatic signer calls; a locked banner + Unlock button the user presses | ✓ |
| Auto, gated by a new preference | Auto-on-load behind a setting mirroring `autoDecryptMessages` | |

**User's choice:** Explicit unlock action only
**Notes:** Rules out silent startup signer prompts on NIP-07 / nostr-connect.

### Q2 — Where the unlock affordance lives (user clarification)

The originally-planned question ("build the unlock component generic or mute-specific?") was
rejected by the user in favour of clarifying the design directly:

> "The unlocking behaviour should be application wide and a generic toggle and opt-in button in
> the side nav. this way users when opening the app can see that things (lists, DMs, mutes, etc)
> are pending an unlock and can then click the button to either unlock the pending items once or
> enable auto-unlock going forward (saved as a preference)"

**Notes:** This widened the phase past its ROADMAP line — flagged to the user, who confirmed by
proceeding. It also makes Q1's answer a hybrid: explicit by default, with a user-enabled
auto-unlock preference.

### Q3 — Behaviour when the mute list is replaced from another device

| Option | Description | Selected |
|--------|-------------|----------|
| Back to locked, wait for the user | The locked affordance reappears; nothing decrypts until pressed | ✓ |
| Auto re-unlock once unlocked before | Persist a per-pubkey "has unlocked" flag and auto-attempt on the replacement event | |
| You decide | Defer to the planner | |

**User's choice:** Back to locked, wait for the user
**Notes:** Verified during discussion that `EncryptedContentSymbol` is in `PRESERVE_EVENT_SYMBOLS`,
so self-published updates stay unlocked; this only affects cross-device edits.

### Q4 — How much of the app-wide mechanism ships in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Generic mechanism + mutes wired | Registry, nav button, preference — mute lists the only registered source | ✓ |
| Generic mechanism + everything wired | Also register DMs and the other `HiddenTagsKinds` lists now | |
| Mutes + DMs only | The two places locked content costs the user something today | |

**User's choice:** Generic mechanism + mutes wired

### Q5 — Scope of the auto-unlock preference

| Option | Description | Selected |
|--------|-------------|----------|
| One global auto-unlock preference | Single boolean covering everything registered | |
| Global preference, per-source override | Master toggle plus per-source opt-outs | |
| Global preference that absorbs `autoDecryptMessages` | Migrate the DM setting onto it now | |

**User's choice:** Free-text —

> "we should add new preferences to the privacy section for generally what kind of events can be
> auto unlocked, there should be an option to unlock all or if thats unchecked then there are
> options for specific categories"

**Notes:** Closest to the per-source option, but explicitly located in Privacy settings with an
"unlock all" master control.

### Q6 — What drives the per-category checkbox list?

| Option | Description | Selected |
|--------|-------------|----------|
| Registry-driven — only wired sources appear | Each registered source contributes its category; no dead toggles | ✓ |
| Fixed category list up front | Write out mutes/DMs/lists/wallet now, most inert | |
| Fixed list, unwired ones disabled | Show all, disable the unimplemented ones | |

**User's choice:** Registry-driven — only wired sources appear

---

## Muted view presentation

### Q1 — How are private entries distinguished once unlocked?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline with a "Private" badge | One list, hidden-sourced rows badged; needs `PublicMuteModel` + `HiddenMuteModel` for attribution | |
| Separate "Private" section | Two groups under their own headings; complicates the `FixedSizeList` | ✓ |
| Tabs: Public / Private | Two virtualized lists, no merge attribution — but hides half the mutes | |

**User's choice:** Separate "Private" section

### Q2 — What shows in the Private section while locked?

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder with its own Unlock button | Locked placeholder plus an Unlock button on the page itself | ✓ |
| Locked placeholder, no button | Show the state; unlocking stays a single app-wide action | |
| Hide the section entirely | Nav count is the only signal | |

**User's choice:** Placeholder with its own Unlock button
**Notes:** Raised that the entry count is unknowable while locked — `hasHiddenTags` reveals only
that hidden content exists.

### Q3 — Does the Private section render more than pubkeys?

| Option | Description | Selected |
|--------|-------------|----------|
| Pubkeys only, match the public list | Smallest change; nothing regresses since public words aren't shown either | ✓ |
| Pubkeys only + a count of the rest | Adds "also N words, M hashtags muted privately" | |
| Everything — all four kinds | Full parity; would invite the same for public mutes | |

**User's choice:** Pubkeys only, match the public list

---

## Locked-state behavior

### Q1 — Timeline behaviour while hidden mutes are locked

| Option | Description | Selected |
|--------|-------------|----------|
| Accept it — the nav button is the signal | Timelines under-filter silently; zero filter-path changes | ✓ |
| One-time dismissible warning | Warn at first render with locked hidden mutes | |
| Persistent banner until unlocked | Non-dismissible, like `ReadAuthRequiredAlert` | |

**User's choice:** Accept it — the nav button is the signal

### Q2 — Locked or disabled decryption cache

| Option | Description | Selected |
|--------|-------------|----------|
| Cache lock is a pending item too | The nav mechanism prompts for the cache password from the same place | ✓ |
| Unlock works, persistence is best-effort | In-memory unlock only when the cache is unavailable | |
| Reuse `RequireDecryptionCache` on the Muted view | Full-page gate, reuses working code | |

**User's choice:** Cache lock is a pending item too
**Notes:** Surfaced that `encryptDecryptionCache` defaults to `true`, so the cache starts locked
every launch and its password is currently only prompted inside the Messages route — meaning the
phase's headline promise would not hold on default settings without this.

### Q3 — Unlock failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + stay locked, retryable | App's existing convention for user-initiated failures | ✓ |
| Toast, and mark failed until reload | Per-item failure state stops auto-unlock looping | |
| Distinguish rejection from real errors | Best behaviour, needs error-text matching | |

**User's choice:** Toast + stay locked, retryable

---

## Write path

### Q1 — How far does Phase 1 go on hidden writes?

| Option | Description | Selected |
|--------|-------------|----------|
| Unmute correctness only | Removal works regardless of which half; adding stays public-only | ✓ |
| Unmute + explicit "mute privately" | Also add hidden mutes via `MuteUser(pubkey, true)` | |
| Read-only — no write changes | Would ship a Remove button that does nothing | |

**User's choice:** Unmute correctness only

### Q2 — How is unmute made correct across both halves?

| Option | Description | Selected |
|--------|-------------|----------|
| Detect the half, then act accordingly | Public keeps the helper path with `mute_expiration` pruning; hidden uses `UnmuteUser(pubkey, true)` | ✓ |
| Consolidate everything on applesauce actions | Cleanest end state, but `mute_expiration` must be re-expressed as a tag operation | |
| Always remove from both halves | No detection logic, but a signer round-trip on every unmute | |

**User's choice:** Detect the half, then act accordingly

### Q3 — What do app-wide mute affordances show for a privately-muted user?

| Option | Description | Selected |
|--------|-------------|----------|
| Merged state, public-only while locked | Correct once unlocked; may misreport while locked | ✓ |
| Merged, and block the action while locked | Never writes a duplicate, but gates a common action | |
| Leave `isMuted` public-only | Mute menu would keep contradicting the Muted page | |

**User's choice:** Merged state, public-only while locked
**Notes:** Raised that `useUserMuteActions` computes `isMuted` from `isPubkeyInList` (public tags
only), so every mute button in the app misreports private mutes today.

---

## Claude's Discretion

None — the user selected a concrete option for every question. No "you decide" answers were given.

## Deferred Ideas

- Wire direct messages into the mechanism; reconcile `autoDecryptMessages` and
  `pending-decryption-alert.tsx` with the generic registry
- Wire the remaining `HiddenTagsKinds` lists (bookmarks, follow sets, interests, public chats)
- "Mute privately" as a write feature
- Managing muted words, hashtags, and threads in the UI
- Deduplicating a pubkey muted both publicly and privately
- Mute expirations for private entries

## Areas raised but not discussed

Offered at wrap-up and declined: mobile/collapsed nav placement (`bottom-nav.tsx`,
`nav-drawer.tsx`, and the desktop group that only renders when expanded), account-switch and
signer-less account handling, and how the registry's pending state is modelled (RxJS vs React
context).
