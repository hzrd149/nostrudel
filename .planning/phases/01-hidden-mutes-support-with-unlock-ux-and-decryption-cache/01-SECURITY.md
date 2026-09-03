---
phase: 01
slug: hidden-mutes-support-with-unlock-ux-and-decryption-cache
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-09-03
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: authored at plan time. All six `*-PLAN.md` files carried a parseable
`<threat_model>` block, so this audit verified declared mitigations rather than building a
retroactive STRIDE register. No `## Threat Flags` entries were raised in any SUMMARY.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| app → signer (NIP-07 / nostr-connect / local key) | Every decrypt and re-encrypt request leaves the app for a user-controlled signer that prompts. Prompt volume and timing are themselves security-relevant. | Hidden mute-list ciphertext, decrypt/encrypt requests |
| app → device storage (Capacitor Preferences) | Auto-unlock preferences persist across sessions and decide whether the app initiates signer traffic on load. | `auto-unlock-all` boolean, `auto-unlock-categories` map |
| app → IndexedDB (decryption cache) | Decrypted hidden-mute plaintext is persisted locally by the pre-existing `persistEncryptedContent` subscription. | Decrypted hidden mute pubkeys |
| user → password field | The decryption-cache password crosses from the user into `EncryptedStorage` key derivation, now reachable from the nav modal as well. | Cache password |
| app → relays | Unmute and private-remove publish a replacement kind-10000 carrying the whole re-encrypted hidden half. | Full mute list (public tags + hidden ciphertext) |
| relays → app | A kind-10000 replacement can arrive from any device holding the user's key. | Untrusted replacement mute list |
| decrypted hidden mutes → rendered DOM | Private mute pubkeys are decrypted content displayed on screen. | Decrypted pubkeys |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Elevation of Privilege | auto-unlock driver, `src/services/pending-unlock.ts` | high | mitigate | Both preferences default `false` (`preferences.ts:111,117`); `attemptedAutoUnlocks` set caps one attempt per account+category per app session (`pending-unlock.ts:153-176`), marked before the await so a failure cannot retry-loop. | closed |
| T-01-02 | Tampering | `autoUnlockCategories` preference map | low | accept | Local-attacker-only; see AR-01. Writes go only through `PreferenceSubject.next`, reads are defensively parsed. | closed |
| T-01-03 | Information Disclosure | `unlockPendingCategories` error path | medium | mitigate | Service rethrows the original `Error` and performs no formatting (`pending-unlock.ts:128-143`); `useAsyncAction` remains the single toast site rendering only `e.message`. | closed |
| T-01-04 | Tampering | hidden unmute branch, `use-user-mute-actions.ts` | high | mitigate | Delegates wholly to `UnmuteUser(pubkey, true)` (`use-user-mute-actions.ts:39`), whose `modifyHiddenTags` unlocks current hidden tags before modifying. No local tag manipulation or encryption. | closed |
| T-01-05 | Repudiation | undeterminable-half unmute | medium | mitigate | Unknown branch throws a descriptive `Error` (`use-user-mute-actions.ts:41`) instead of falling through to the public path; menu item disabled via `canUnmute` (`menu/mute-user.tsx:16,21`). | closed |
| T-01-06 | Information Disclosure | merged `isMuted` reports public-only while locked | low | accept | Explicitly accepted by D-15; see AR-02. Signed off in UAT test 13. | closed |
| T-01-07 | Tampering | cross-device mute-list replacement | high | mitigate | Locked state is derived per-event from `hasHiddenTags && !isHiddenMutesUnlocked` (`pending-unlock-mutes.ts`); no persistent "has unlocked before" flag and no automatic re-unlock exist, so a new event id returns the category to pending. | closed |
| T-01-08 | Information Disclosure | decrypted hidden mutes persisted in IndexedDB | high | mitigate | No new persistence path added; `src/services/decryption-cache.ts` is unmodified on this branch. Plaintext travels the pre-existing `EncryptedStorage` route with `encryptDecryptionCache` on by default. | closed |
| T-01-09 | Spoofing | cache password form | medium | mitigate | `cache-unlock-form.tsx:31-40` calls `EncryptedStorage.unlock(password)` directly; no comparison, derivation, or crypto is re-implemented. | closed |
| T-01-10 | Elevation of Privilege | mutes unlock on a read-only account | low | mitigate | `canUnlock$` excludes `ReadonlyAccount`; `unlock()` additionally throws explicit descriptive errors for the no-account and read-only cases (`pending-unlock-mutes.ts`). | closed |
| T-01-11 | Elevation of Privilege | "Unlock now" batch action | high | mitigate | `unlockPendingCategories` rethrows immediately on a signer-refusal-shaped error, stopping the batch at the first refusal (`pending-unlock.ts:133-134`); only two categories are registered (`pending-unlock-mutes.ts`, `pending-unlock-cache.ts`). | closed |
| T-01-12 | Information Disclosure | error toasts from failed unlocks | medium | mitigate | Every action routes through `useAsyncAction`; `pending-unlock-modal.tsx` contains zero `catch` blocks and no custom error formatting. | closed |
| T-01-13 | Spoofing | cache password field inside the nav modal | medium | mitigate | Modal renders the category's own registered `unlockComponent` (`pending-unlock-modal.tsx:45-47`) rather than a second password implementation — exactly one code path sees the cache password. | closed |
| T-01-14 | Denial of Service | auto-unlock enabled from the modal | low | accept | Explicit user-initiated opt-in, session-bounded, reversible; see AR-03. | closed |
| T-01-15 | Elevation of Privilege | unlock-all switch | high | mitigate | Defaults off; helper text states the app "will ask your signer to decrypt all locked content … as soon as it starts" rather than framing it as convenience (`settings/privacy/index.tsx:253-259`); driver caps attempts per session. | closed |
| T-01-16 | Tampering | per-category preference map | low | accept | Same local-attacker rationale as T-01-02; see AR-01. UI writes only through `setAutoUnlockCategory`, which replaces the map immutably. | closed |
| T-01-17 | Spoofing | category labels rendered from the registry | low | mitigate | Both registrations are static in-repo modules; labels/descriptions render from the registry descriptor (`settings/privacy/index.tsx:266,274`). No relay- or user-supplied string reaches the list. | closed |
| T-01-18 | Information Disclosure | locked placeholder | medium | mitigate | Locked state renders from `hasHiddenTags` only, with no count and no placeholder rows (`private-mutes-section.tsx:30-34`) — the private list size is never leaked pre-decryption. | closed |
| T-01-19 | Tampering | Remove on a Private row | high | mitigate | Delegates to `UnmuteUser(pubkey, hidden)` (`muted-user-card.tsx:26`), whose `modifyHiddenTags` unlocks current hidden tags first. Rows are reachable only in the unlocked state. | closed |
| T-01-20 | Repudiation | Remove on a row whose half is mismatched | high | mitigate | Public rows source from `PublicMutesQuery` (`muted/index.tsx:34`) and private rows from `HiddenMutesQuery` (`private-mutes-section.tsx:22`), so each row's `hidden` flag is fixed by construction, never guessed. | closed |
| T-01-21 | Denial of Service | unvirtualized Private list | low | accept | Bounded by `maxH="320px"` with scrolling and a code comment naming the `FixedSizeList` swap; see AR-04. | closed |
| T-01-SC | Tampering | npm/pnpm installs | high | mitigate | Verified: `git diff master...HEAD` touches neither `package.json` nor `pnpm-lock.yaml`. No dependency was added anywhere in the phase. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-02, T-01-16 | A local attacker able to flip the stored auto-unlock preferences already holds the app session and its signer access; the preference grants no capability they lack. Values are written only via `PreferenceSubject.next` and defensively parsed on read, so a corrupt value cannot crash the service. | hzrd149 (plan-time disposition) | 2026-09-03 |
| AR-02 | T-01-06 | While the hidden half is locked, `isMuted` reports public-only, so pressing Mute on a privately-muted-but-locked pubkey adds a public duplicate. Documented and accepted as D-15 in 01-CONTEXT.md; cross-half deduplication is a Deferred Idea. Re-confirmed by the user in UAT test 13 (CR-01 design-tradeoff sign-off). | hzrd149 (UAT test 13) | 2026-09-03 |
| AR-03 | T-01-14 | Enabling auto-unlock from the modal makes future app starts issue decrypt requests without a click. It is an explicit user-initiated opt-in (D-02), bounded to one attempt per category per account per session, and reversible from Privacy settings (D-04). | hzrd149 (plan-time disposition) | 2026-09-03 |
| AR-04 | T-01-21 | A user with thousands of private mutes would render thousands of rows. Accepted under RESEARCH.md Assumption A3 (private lists are expected small), bounded by `maxH` with scrolling, with the `FixedSizeList` swap named in a code comment should the assumption fail. | hzrd149 (plan-time disposition) | 2026-09-03 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-03 | 22 | 22 | 0 | /gsd-secure-phase (L1 short-circuit, register authored at plan time) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-03
