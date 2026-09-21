---
phase: quick-260920-qwp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - pnpm-lock.yaml
  - src/providers/global/napplet-shell-provider.tsx
  - src/components/napplets/napplet-frame.tsx
  - src/helpers/nostr/napplets.ts
autonomous: true
requirements: [QUICK-260920-NAPPLET-KEHTO-BUMP]

estimate:
  tokens: 40000
  raw_tokens: 40000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "`@kehto/runtime`, `@kehto/services`, `@kehto/shell`, `@napplet/core` and `@napplet/nap` resolve in `pnpm-lock.yaml` to the newest versions published on npm as of 2026-09-21: 0.24.0, 0.21.2, 0.21.2, 0.32.0, 0.32.0. `@kehto/nip` stays at 0.5.2 because 0.5.2 already is the newest published version."
    - "The whole `@kehto`/`@napplet` set lands on the same generation. Every `@kehto/*` package at these versions declares a peer range of `>=0.32.0 <0.33.0` on `@napplet/core` and `@napplet/nap`, so a partial bump cannot install. The two transitive packages `@kehto/acl` and `@kehto/firewall` move with it, to 0.19.0 and 0.6.0."
    - "`pnpm build` (tsc typecheck plus vite build, the configured build and test command in `.planning/config.json`) succeeds against the new versions."
    - "`resource:fetch`, the capability that quick task 260920-q7c's Blossom gate depends on, is still a member of `ALL_CAPABILITIES` after the bump, so `hasApprovedCapability(identity, \"resource:fetch\")` in the shell provider keeps gating on a real capability string rather than a string the ACL no longer knows."
    - "No `@kehto/*` or `@napplet/*` package name other than the eight already in the tree enters `pnpm-lock.yaml`, and no package under those scopes is present at two versions at once."
    - "Any source file this change touches still reports zero error-severity aislop findings, and no more warnings than its measured pre-change baseline."
  artifacts:
    - path: package.json
      provides: "five bumped dependency ranges (`@kehto/runtime`, `@kehto/services`, `@kehto/shell`, `@napplet/core`, `@napplet/nap`); `@kehto/nip` unchanged at ^0.5.2"
      contains: "\"@napplet/core\": \"^0.32.0\""
    - path: pnpm-lock.yaml
      provides: "resolved tree for the 0.32 napplet generation, including the transitive moves of @kehto/acl to 0.19.0 and @kehto/firewall to 0.6.0"
      contains: "'@kehto/runtime@0.24.0':"
  key_links:
    - from: "package.json `@napplet/core` / `@napplet/nap` ranges"
      to: "the peerDependencies of @kehto/acl, @kehto/firewall, @kehto/runtime, @kehto/services and @kehto/shell"
      via: "every @kehto package at the target versions pins `>=0.32.0 <0.33.0` on both napplet packages, so the six ranges have to move in one edit or pnpm fails with a peer-dependency error"
      pattern: "@napplet/core"
    - from: "`ALL_CAPABILITIES` re-exported by @kehto/shell from @kehto/runtime, which re-exports it from @kehto/acl/capabilities"
      to: "`const CAPABILITIES = new Set<string>(ALL_CAPABILITIES)` in src/helpers/nostr/napplets.ts"
      via: "getNappletRequiredCapabilities filters a manifest's `requires` tags through that Set before casting to Capability, so the acl 0.17.0 -> 0.19.0 move changes which manifest capabilities the consent modal will surface"
      pattern: "ALL_CAPABILITIES"
    - from: "@kehto/shell and @kehto/services exports"
      to: "src/providers/global/napplet-shell-provider.tsx and src/components/napplets/napplet-frame.tsx"
      via: "the provider imports eleven symbols from @kehto/shell and seventeen from @kehto/services; tsc is the gate that catches any signature change in them"
      pattern: "from \"@kehto/"
---

<objective>
Move every `@napplet/*` and `@kehto/*` dependency to its newest published version. That is five range bumps in `package.json` plus the lockfile resolution, and then whatever source adaptation `tsc` demands.

Purpose: The app is one napplet protocol generation behind. The installed tree is on `@napplet/core` 0.31.1 / `@napplet/nap` 0.31.2 with `@kehto/shell` 0.19.2, while npm has the 0.32 generation. The gap is not optional to close piecemeal: every `@kehto/*` package at its newest version declares `@napplet/core >=0.32.0 <0.33.0` as a peer, so the set moves together or not at all.

Output: bumped `package.json` ranges, a regenerated `pnpm-lock.yaml`, any source edits `tsc` requires, and a green `pnpm build`.
</objective>

<execution_context>
@/home/user/.claude/gsd-core/workflows/execute-plan.md
@/home/user/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@/home/user/Projects/noStrudel/AGENTS.md
@/home/user/Projects/noStrudel/.claude/CLAUDE.md
@/home/user/Projects/noStrudel/package.json

<interfaces>
<!-- Registry and type facts gathered while planning on 2026-09-21. The executor does not need to re-derive them. -->

Version table (`pnpm view <pkg> version`, 2026-09-21):

| package | current range | currently resolved | newest published | action |
|---|---|---|---|---|
| `@kehto/nip` | `^0.5.2` | 0.5.2 | 0.5.2 | leave alone, already newest |
| `@kehto/runtime` | `^0.21.0` | 0.21.0 | 0.24.0 | bump to `^0.24.0` |
| `@kehto/services` | `^0.19.0` | 0.19.0 | 0.21.2 | bump to `^0.21.2` |
| `@kehto/shell` | `^0.19.2` | 0.19.2 | 0.21.2 | bump to `^0.21.2` |
| `@napplet/core` | `^0.31.1` | 0.31.1 | 0.32.0 | bump to `^0.32.0` |
| `@napplet/nap` | `^0.31.2` | 0.31.2 | 0.32.0 | bump to `^0.32.0` |
| `@kehto/acl` | transitive | 0.17.0 | 0.19.0 | pnpm resolves it, no manifest edit |
| `@kehto/firewall` | transitive | 0.5.0 | 0.6.0 | pnpm resolves it, no manifest edit |

Peer coupling, read from each target version's published manifest:
- `@kehto/runtime@0.24.0`, `@kehto/services@0.21.2`, `@kehto/shell@0.21.2` and `@kehto/acl@0.19.0` each declare `@napplet/core: ">=0.32.0 <0.33.0"` and `@napplet/nap: ">=0.32.0 <0.33.0"`. `@kehto/firewall@0.6.0` declares the `@napplet/core` half.
- `@kehto/services@0.21.2`, `@kehto/shell@0.21.2` and `@kehto/nip@0.5.2` declare `nostr-tools: ">=2.23.3 <=2.x"`. The repo pins `nostr-tools` to 2.23.5 through `overrides` in `pnpm-workspace.yaml`, which satisfies that, so no override change is needed.
- `@kehto/runtime@0.24.0` depends on `@kehto/acl ^0.19.0` and `@kehto/firewall ^0.6.0`; `@kehto/shell@0.21.2` depends on `@kehto/acl ^0.19.0` and `@kehto/runtime ^0.24.0`; `@kehto/services@0.21.2` depends on `@kehto/runtime ^0.24.0`. That is why the two transitives move on their own.
- `@napplet/nap@0.32.0` keeps the same single peer as 0.31.2, `json-schema-to-ts ^3.1.1`, which is already in the lockfile. No new peer appears.

Release age: `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` exists because pnpm withholds freshly published versions. None of the target versions is fresh — the newest publish timestamp in the set is `@kehto/runtime@0.24.0` and `@kehto/services@0.21.2` at 2026-09-07, two weeks before today, and `@napplet/core@0.32.0` / `@napplet/nap@0.32.0` date from 2026-08-26. `pnpm config get minimumReleaseAge` returns `undefined`. So the expected outcome is that no `minimumReleaseAgeExclude` entry is needed. The file's existing entries are stale pins for versions no longer installed; the repo has only ever appended to that list (commit a9ad3f626), never pruned it, so leave them.

Exported-symbol check (done at plan time by diffing the installed `dist/index.d.ts` files against the published ones for 0.21.2 / 0.32.0): every symbol the three consuming source files import still exists in the new versions. Nothing the repo imports was removed. Concretely, the repo imports:
- from `@kehto/shell`: `ALL_CAPABILITIES`, `Capability`, `RelayPoolLike`, `ShellAdapter`, `ShellBridge`, `ShellCapabilities`, `buildShellCapabilities`, `createShellBridge`, `injectNappletNamespacePrelude`, `originRegistry`, `sessionRegistry`
- from `@kehto/services`: `IntentAvailability`, `IntentCandidate`, `IntentRequest`, `IntentResult`, `OutboxRelayPool`, `RelayListEntry`, `createCommonService`, `createIdentityService`, `createIntentService`, `createLinkService`, `createNotifyService`, `createOutboxService`, `createRelayPoolOutboxRouter`, `createRelayPoolService`, `createThemeService`, `createUploadService`, `manifestToIntentCatalogEntry`
- from `@napplet/core`: `CommonActionResult`, `CommonFollowsResult`, `CommonProfileResult`, `CommonProfileTarget`, `CommonReaction`, `CommonReportReason`, `CommonReportTarget`
- from `@kehto/nip` (unchanged version): `NAPPLET_KIND_NAMED`, `NAPPLET_KIND_ROOT`, `NAPPLET_KIND_SNAPSHOT`, `ResolvedNapplet`, `isNappletManifestKind`, `openNappletArtifactCache`, `parseNappletManifest`, `resolveNapplet`

Signature changes are still possible and are not covered by that check — `tsc` is the gate for them. Prior bumps of this same set each needed a small source edit: 38f0eb9f6 touched napplet-frame.tsx and helpers/nostr/napplets.ts, a9ad3f626 touched napplet-shell-provider.tsx, 1ef74bdae touched napplet-frame.tsx. Expect something in that range, not nothing and not a rewrite.

Capability surface change, acl 0.17.0 -> 0.19.0: `ALL_CAPABILITIES` gains `fs:read` and `fs:write` at the end. Nothing is removed — in particular `resource:fetch`, which the just-landed quick task 260920-q7c gates Blossom downloads on, survives. The repo consumes `ALL_CAPABILITIES` only as `new Set<string>(...)` with a runtime membership test in `src/helpers/nostr/napplets.ts` (there is no exhaustive `Record<Capability, ...>` anywhere in `src/`), so the addition compiles without a code change. The visible effect is that a manifest requesting `fs` capabilities would now pass the filter and be listed in the consent modal even though this shell registers no fs service. That is a behaviour note for the SUMMARY, not a defect to fix in this task.

`@napplet/core` adds one export, `ResourceBytesRequest`. `@kehto/services` adds `FsService`, `createFsService`, `FsBackend`, `ResourceFetchInit`, `ResourceErrorCode`, `ConfigSettingsContext`, `resolveConfigValues`, `validateConfigSchema` and related types. None of these are wired up by this plan.

aislop baselines measured at plan time (`pnpm exec aislop scan --json --include <file> .`), all zero errors:
- `package.json`: 0 errors, 12 warnings (dependency advisories, downgraded to warning in `.aislop/config.yml`)
- `src/providers/global/napplet-shell-provider.tsx`: 0 errors, 19 warnings
- `src/components/napplets/napplet-frame.tsx`: 0 errors, 2 warnings
- `src/helpers/nostr/napplets.ts`: 0 errors, 0 warnings

Changeset convention: the three prior bumps of this exact dependency set (38f0eb9f6, a9ad3f626, 1ef74bdae) each shipped with no changeset, and `AGENTS.md` does not require one. So the default here is no changeset. Add one only if the source adaptation in Task 1 changes user-visible behaviour, in which case follow the shape of `.changeset/quiet-napplets-fetch.md`.

Environment note from `.planning/STATE.md`: `pnpm dev` was killed by the OS on this machine during Phase 03 (memory exhaustion). Do not verify through the dev server. `pnpm build` is the gate; the optional manual check below uses `pnpm exec vite preview` against the already-built `dist/`, which is far lighter.

The `.claude/skills/applesauce` symlink points at `.agents/skills/applesauce`, which does not exist in this checkout. There are no readable project skill rules. Do not repair the symlink as part of this task.
</interfaces>
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Bump the five ranges to the 0.32 napplet generation, resolve the lockfile, and get pnpm build green</name>
  <files>package.json, pnpm-lock.yaml, src/providers/global/napplet-shell-provider.tsx, src/components/napplets/napplet-frame.tsx, src/helpers/nostr/napplets.ts</files>
  <action>
This is one atomic slice on purpose: manifest, lockfile, typecheck and bundle in a single commit. The peer ranges make it impossible to split — installing a subset of the set fails resolution — and committing a bumped lockfile before the code compiles would leave a red build in history.

1. Edit `package.json` `dependencies`. Set `@kehto/runtime` to `^0.24.0`, `@kehto/services` to `^0.21.2`, `@kehto/shell` to `^0.21.2`, `@napplet/core` to `^0.32.0`, `@napplet/nap` to `^0.32.0`. Leave `@kehto/nip` at `^0.5.2`, which is already the newest published version. Touch no other dependency. Keep the existing alphabetical ordering and formatting.

2. Run `pnpm install`. Expect it to move `@kehto/acl` to 0.19.0 and `@kehto/firewall` to 0.6.0 on its own; those are transitive and must not be added to `package.json`.

   If the install fails on a peer-dependency error, do not relax a range or add a peer override — it means one of the six numbers above is wrong; re-check with `pnpm view <pkg> version` and correct it.

   If, and only if, the install fails because a version is younger than the minimum release age, append the exact failing `name@version` strings to the end of the `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml`, matching the existing quoted entry style, and re-run. Do not remove or reorder the stale entries already in that list; this repo appends to it. Based on the publish timestamps in the interfaces block this branch is not expected to trigger.

3. Run `pnpm build`. It is `tsc --project tsconfig.json && vite build`.

4. If `tsc` reports errors, fix them in the consuming source files only — `src/providers/global/napplet-shell-provider.tsx`, `src/components/napplets/napplet-frame.tsx`, `src/helpers/nostr/napplets.ts` are the only three files in `src/` that reference these packages. Rules for those edits:
   - Adapt to the new API. Do not silence a type error with a cast to `any`, a non-null assertion, or a `@ts-expect-error`. `ai-slop` flags unsafe casts and the repo's standard is to fix the underlying call.
   - Preserve the behaviour quick task 260920-q7c landed: `hasApprovedCapability(identity, "resource:fetch")` stays the gate for napplet resource fetches, alongside the account's own Blossom origins. `resource:fetch` is still a valid capability string in acl 0.19.0, so this should need no change.
   - Follow `AGENTS.md` for style, error handling and the swallowed-exception rules. Use relative imports.
   - Fix any aislop finding your own edit introduces. Do not sweep a file's pre-existing warnings (`.claude/CLAUDE.md`, D-16).
   - If an upstream change removes a capability, a service factory, or a message type the app depends on, stop and report it rather than inventing a replacement.

5. Re-run `pnpm build` until it passes.

6. Record in the SUMMARY: the before and after version of all eight packages, every source file you had to touch and what the upstream change was, whether `pnpm-workspace.yaml` needed an entry, and the list of package names added to or removed from the lockfile (step 4 of the verify prints it).
  </action>
  <verify>
    <automated>cd /home/user/Projects/noStrudel && node -e 'const d=require("./package.json").dependencies,w={"@kehto/nip":"^0.5.2","@kehto/runtime":"^0.24.0","@kehto/services":"^0.21.2","@kehto/shell":"^0.21.2","@napplet/core":"^0.32.0","@napplet/nap":"^0.32.0"};for(const k in w){if(d[k]!==w[k])throw new Error(k+" is "+d[k]+", expected "+w[k]);}console.log("manifest ok")' && for k in "@kehto/acl@0.19.0" "@kehto/firewall@0.6.0" "@kehto/nip@0.5.2" "@kehto/runtime@0.24.0" "@kehto/services@0.21.2" "@kehto/shell@0.21.2" "@napplet/core@0.32.0" "@napplet/nap@0.32.0"; do grep -q "^  '$k'" pnpm-lock.yaml || { echo "lockfile missing $k"; exit 1; }; done && echo "lockfile ok" && test "$(grep -oE "^  '@(kehto|napplet)/[a-z]+@[0-9][0-9.]*" pnpm-lock.yaml | sort -u | wc -l)" = 8 && echo "scope set is exactly 8 name@version keys" && echo "--- lockfile package-name diff vs HEAD (informational, record in SUMMARY) ---" && diff <(git show HEAD:pnpm-lock.yaml | sed -n '/^packages:/,/^snapshots:/p' | grep -oE "^  '?(@[^/@']+/)?[^@']+@" | sed "s/^  '\?//;s/@$//" | sort -u) <(sed -n '/^packages:/,/^snapshots:/p' pnpm-lock.yaml | grep -oE "^  '?(@[^/@']+/)?[^@']+@" | sed "s/^  '\?//;s/@$//" | sort -u) || true && grep -q '"resource:fetch"' node_modules/.pnpm/@kehto+acl@0.19.0*/node_modules/@kehto/acl/dist/capabilities.d.ts && echo "resource:fetch still a capability" && pnpm build</automated>
  </verify>
  <done>
- `package.json` carries exactly the six ranges in the table, with `@kehto/nip` untouched.
- `pnpm-lock.yaml` resolves all eight packages to the target versions, with no `@kehto`/`@napplet` package present at two versions.
- `resource:fetch` is still in the acl capability list, so quick task 260920-q7c's Blossom gate still refers to a real capability.
- The lockfile package-name diff against `HEAD` has been printed and captured for the SUMMARY.
- `pnpm build` exits 0.
  </done>
</task>

<task type="auto">
  <name>Task 2: Confirm the touched files clear the lint gate and no unreviewed package entered the tree</name>
  <files>package.json, pnpm-lock.yaml</files>
  <action>
1. Run the scoped aislop scan over `package.json` and the three napplet source files. The bar, against the plan-time baselines: zero error-severity findings anywhere in that set; `src/providers/global/napplet-shell-provider.tsx` at most 19 findings; `src/components/napplets/napplet-frame.tsx` at most 2; `src/helpers/nostr/napplets.ts` zero. `package.json`'s warning count is not capped — those are `security/vulnerable-dependency` advisories, downgraded in `.aislop/config.yml` and reported on a file that cannot carry an inline ignore, and the advisory set legitimately shifts when the tree changes. Record the new count in the SUMMARY.

   If a source file you touched in Task 1 now carries an error-severity finding, fix it. `AGENTS.md` wins over the `.claude/CLAUDE.md` do-not-sweep override on this specific point: the CI gate fails on any error-severity finding in a touched file, including inherited ones, so the choice is to fix it or add a rule-scoped `aislop-ignore-*` naming the rule and ending with `-- reason`. Bare directives are not allowed.

2. Review the lockfile package-name diff printed by Task 1's verify. Every added name should be a dependency of the new `@kehto`/`@napplet` versions. If a name appeared that you cannot attribute to one of them, stop and report it rather than committing — this is the supply-chain check standing in for a package legitimacy audit, which quick tasks have no RESEARCH.md to carry.

3. Decide the changeset. The default is none: the three prior bumps of this same set shipped without one, and a dependency bump with no behaviour change is not user-visible. Add a patch changeset in the shape of `.changeset/quiet-napplets-fetch.md` only if Task 1's source adaptation changed what a user sees. State the decision and its reason in the SUMMARY either way.
  </action>
  <verify>
    <automated>cd /home/user/Projects/noStrudel && pnpm exec aislop scan --json --include package.json --include src/helpers/nostr/napplets.ts --include src/components/napplets/napplet-frame.tsx --include src/providers/global/napplet-shell-provider.tsx . 2>/dev/null | jq -e '([.diagnostics[] | select(.severity=="error")] | length == 0) and ([.diagnostics[] | select(.filePath=="src/providers/global/napplet-shell-provider.tsx")] | length <= 19) and ([.diagnostics[] | select(.filePath=="src/components/napplets/napplet-frame.tsx")] | length <= 2) and ([.diagnostics[] | select(.filePath=="src/helpers/nostr/napplets.ts")] | length == 0)' && echo "lint bar met" && pnpm build</automated>
  </verify>
  <done>
- Zero error-severity aislop findings across `package.json` and the three napplet source files.
- Each source file is at or below its plan-time warning baseline; `package.json`'s advisory count is recorded, not gated.
- Every package name added to the lockfile is attributable to a new `@kehto`/`@napplet` version, or the task stopped and reported it.
- The changeset decision is made and justified in the SUMMARY.
- `pnpm build` still exits 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry -> build machine | `pnpm install` fetches and executes package tarballs from a remote registry into the build |
| napplet iframe -> shell (postMessage) | Untrusted napplet code runs under `sandbox="allow-scripts"`; the ACL in `@kehto/acl`, whose capability list this bump changes, is what decides which of its messages the shell will serve |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qwp-SC | Tampering | `pnpm install` of the `@kehto`/`@napplet` set | high | accept | No new package name is introduced. All eight names are already in `pnpm-lock.yaml` at a prior version and have been installed across three previous bumps (38f0eb9f6, a9ad3f626, 1ef74bdae); only version numbers change. Each target version was confirmed at plan time through `pnpm view`, with a publish timestamp between 2026-08-26 and 2026-09-07. The residual risk is a compromised release of an already-trusted package, which a legitimacy audit of package names would not catch either. |
| T-qwp-01 | Tampering | transitive dependency resolution in `pnpm-lock.yaml` | medium | mitigate | Task 1's verify asserts the `@kehto`/`@napplet` scopes contain exactly eight `name@version` keys, so no extra package under those scopes and no duplicate version can slip in. It also prints the full added/removed package-name diff against `HEAD`, and Task 2 requires every added name to be attributable to a new version before the change is committed. |
| T-qwp-02 | Elevation of privilege | `ALL_CAPABILITIES` from `@kehto/acl` 0.19.0 -> the consent modal | medium | accept | The new capability list adds `fs:read` and `fs:write`. `getNappletRequiredCapabilities` admits any string in that list, so a manifest can now put filesystem capabilities in front of the user for approval. Approving one grants nothing: this shell registers no fs service, so the runtime has no handler to dispatch `fs.*` messages to. The exposure is a misleading consent prompt, not access. Recorded for a follow-up that filters the consent list to capabilities the shell actually implements. |
| T-qwp-03 | Elevation of privilege | `hasApprovedCapability(identity, "resource:fetch")` in the shell provider | high | mitigate | Quick task 260920-q7c's Blossom download gate compares against the literal string `resource:fetch`. If the acl renamed or dropped it, the comparison would silently never match, or worse, `getNappletRequiredCapabilities` would filter it out of the consent list. Verified at plan time that 0.19.0 still exports it, and Task 1's verify re-asserts its presence in the installed `capabilities.d.ts` before `pnpm build` runs. |
| T-qwp-04 | Denial of service | the running app after a protocol-generation bump | medium | mitigate | `tsc` catches signature breaks but not postMessage protocol drift between the 0.31 and 0.32 napplet generations. `pnpm build` is the blocking gate; the non-blocking manual check below exercises a real napplet load against the built bundle. |
</threat_model>

<verification>
- Task 1's gate: the six manifest ranges are exact, all eight packages resolve to the target versions in the lockfile, the `@kehto`/`@napplet` scopes hold exactly eight distinct `name@version` keys, `resource:fetch` is still in the installed capability list, and `pnpm build` exits 0.
- Task 2's gate: zero error-severity aislop findings across `package.json` and the three napplet source files, each source file at or below baseline, and `pnpm build` still green.
- Optional manual check, not blocking. `pnpm dev` has been unreliable on this machine (STATE.md, Phase 03 OOM), so use the build output instead: run `pnpm exec vite preview` against the `dist/` that `pnpm build` just produced, open a napplet, and confirm the consent modal lists the manifest's capabilities and the frame mounts and renders. If the napplet declares `requires resource`, confirm a resource fetch still succeeds after approval — that exercises the q7c gate across the protocol-generation change.
</verification>

<success_criteria>
- `@kehto/runtime`, `@kehto/services`, `@kehto/shell`, `@napplet/core` and `@napplet/nap` are at 0.24.0, 0.21.2, 0.21.2, 0.32.0 and 0.32.0 in both `package.json` and `pnpm-lock.yaml`; `@kehto/nip` is untouched at 0.5.2; `@kehto/acl` and `@kehto/firewall` followed to 0.19.0 and 0.6.0.
- `pnpm build` succeeds.
- The lint bar in Task 2 is met.
- The SUMMARY records the eight before/after versions, any source adaptation and the upstream change that forced it, the lockfile name diff, the `package.json` advisory count, and the changeset decision.
</success_criteria>

<output>
Create `.planning/quick/260920-qwp-update-all-napplet-and-kehto-dependencie/260920-qwp-SUMMARY.md` when done
</output>
