---
phase: 04-dead-code-and-import-hygiene-sweep
scope: gap-closure plan 04-14 only (commits 7ab167469, 73668e40e off a42dbdcf4)
reviewed: 2026-10-01T17:38:07Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - vite.config.ts
  - src/polyfill.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 04 Plan 14: Scoped Code Review Report

**Reviewed:** 2026-10-01T17:38:07Z
**Depth:** standard
**Files Reviewed:** 2
**Diff base:** `a42dbdcf4` (commits `7ab167469`, `73668e40e`)
**Status:** issues_found

> Scoped to gap-closure plan 04-14. The diff is two lines of code (`global: "window"` to
> `global: "globalThis"` in the Vite `define`, and `window.global ||= window` to
> `globalThis.global ||= globalThis` in `src/polyfill.ts`) plus a rewritten 3-line comment.
> Pre-existing `console.log` and `@ts-ignore` findings in both files are out of scope (backlog 999.8).

## Summary

The fix is correct and I found no BLOCKER. I checked it against Vite 8.1.5's source in
`node_modules` instead of trusting the plan's description:

- **Dev module workers (the defect itself).** `clientInjectionsPlugin`
  (`node_modules/vite/dist/node/chunks/node.js:24826-24833`) runs `serializeDefine`, which emits string
  values raw (`handleDefineValue` returns the string unchanged). That gives env.mjs line 8
  `const defines = {"global": globalThis};`. I ran the real `env.mjs` with both values in an empty
  `vm` context that has no `window`. `window` throws `window is not defined`, the user's exact error.
  `globalThis` evaluates, and `global === globalThis` afterwards. The diagnosis and the fix agree.
- **Dev main thread.** In dev, `vite:define`'s `transform` returns early for
  `consumer === "client"` (`node.js:24772`), so user source is never rewritten in dev. `global`
  exists at runtime only because `/@vite/client` imports env.mjs, which now assigns
  `globalThis.global = globalThis` instead of `= window`. On the main thread both names refer to the
  same WindowProxy, so behaviour is the same.
- **Dev optimized deps.** `prepareRolldownOptimizerRun` (`node.js:31627-31630`) passes only
  `process.env.NODE_ENV` and `optimizeDeps.rolldownOptions.transform.define`, not `config.define`.
  Prebundled deps get the same env.mjs runtime global as user code. The change doesn't affect them.
- **Production chunks and workers.** The bundled-environment branch of `vite:define`
  (`node.js:24758-24768`) puts the user define into Rolldown's `transform.define`. Free `global`
  identifiers become `globalThis` at build time. `globalThis.global` in `polyfill.ts` is a member
  property, not a free identifier, so it is left alone. The built entry chunk confirms this:
  `console.log(\`polyfill global\`),globalThis.global||=globalThis`. None of the prod worker bundles
  (`miner-*`, the `@snort/worker-relay` worker, `sqlite3-worker1-*`) has a bare `global` before or
  after the change. The only `global` token in `@sqlite.org/sqlite-wasm`'s sources is in a comment. So
  only `dist/sw.js` changes.
- **injectManifest service worker.** vite-plugin-pwa 1.3.0 passes `viteOptions.define` into the SW
  build (`node_modules/vite-plugin-pwa/dist/vite-build-*.js:60`). Capacitor's fallback chain in
  `dist/sw.js:4764` now ends in `globalThis`. That tail could never be reached anyway, because the
  first branch of the chain already returns `globalThis`. With the old value, any unguarded `global.X`
  in the SW graph would have resolved to `window.X` and thrown in production. The change also fixes
  that latent bug.
- **Build targets.** `globalThis` shipped in Chrome/Edge 71, Firefox 65 and Safari 12.1. Logical
  assignment `||=` shipped in Chrome 85, Firefox 79 and Safari 14. All of these are below
  chrome89/edge89/firefox89/safari15, so the change brings in no new syntax or API. Capacitor's
  `minWebViewVersion` default (60) is already below what the chrome89 target requires, but that is
  pre-existing and not affected here.

The findings below are about how durable the fix is and how accurate its claims are. None of them is
a defect in the two changed lines.

## Narrative Findings (AI reviewer)

### Warnings

#### WR-01: Nothing in the repo stops the dev-worker regression from coming back

**File:** `vite.config.ts:41-46`
**Classification:** WARNING (robustness)

The root-cause rule this plan found ("a string define value is inlined raw into every dev module
worker's env prelude, so it must evaluate in every JS realm") lives only in a code comment. The proof
was the plan's ephemeral `WORKER_PRELUDE_OK` vm check, which was never committed. Two easy edits would
silently bring back the exact 04-UAT test 2 blocker, and `pnpm build`, `pnpm test` and aislop would all
still pass:

- reverting this value (it looks cosmetic, and `window` is the more familiar spelling), or
- adding any other define whose value names a DOM-only binding, e.g. `__APP_ORIGIN__: "window.location.origin"`
  or `"document"`.

The production build won't catch either one. Prod workers have no env prelude, and the miner bundle
contains no `global`. Only a person running `pnpm dev` and mining with difficulty above 0 sees the
failure. The SUMMARY also notes that `vitest` is now installed and wired to `pnpm test`, so a cheap
guard has a place to live.

**Fix:** commit the plan's prelude check as a vitest test so the rule is enforced:

```ts
// src/build/vite-define.test.ts
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect, it } from "vitest";
import config from "../../vite.config";

it("every define value evaluates in a window-less worker realm (dev /@vite/env prelude)", () => {
  const env = readFileSync("node_modules/vite/dist/client/env.mjs", "utf8");
  const defines = Object.entries(config.define ?? {})
    .filter(([k]) => !k.startsWith("import.meta.env."))
    .map(([k, v]) => `${JSON.stringify(k)}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
  expect(() => vm.runInContext(env.replace("__DEFINES__", `{${defines}}`), vm.createContext({}))).not.toThrow();
});
```

Importing `vite.config.ts` runs its top-level `console.log` loop. That is harmless in a test.
Mirroring `serializeDefine` keeps the test independent of Vite internals.

---

#### WR-02: `src/polyfill.ts` covers almost nothing, so the claim that the two shims "cannot drift back apart" doesn't hold

**File:** `src/polyfill.ts:4` (imported at `src/index.tsx:1`)
**Classification:** WARNING (misleading safety net, pre-existing behaviour, restated as a guarantee by this plan)

The plan's must-have truth #4 and the commit subject of `73668e40e` describe the polyfill as the
main-thread runtime counterpart to the define. Measured against what actually runs, it covers almost
nothing in either mode:

- **Production:** in `dist/assets/index-vqkh6hYR.js` the assignment sits at byte 22786, after **all
  158** of the entry chunk's static `import` statements. Those include `./capacitor-*.js`,
  `./post-modal-provider-*.js` (which holds the PoW code) and `./env-*.js`. ES module evaluation
  runs every imported chunk's top level before the importer's body. So no module-scope `global` access
  in any vendor or app chunk can ever see the polyfill. In production only the build-time define
  protects them. `import "./polyfill"` being first in `index.tsx` orders source modules, but Rolldown
  hoists chunk imports above it.
- **Dev:** `/@vite/client` imports env.mjs, which sets `globalThis.global` before any app module runs
  (see Summary). The polyfill's `||=` is then always a no-op.

The polyfill only does anything for code that looks up `global` dynamically after the entry body has
run, such as `globalThis.global`, `Function("return global")()` or eval'd strings. Nothing in `src/`
does this (`grep -w global src` finds only provider import paths). The risk is a maintainer trusting
the stated pairing and removing the define as "redundant with the polyfill". That would ship bare
`global` references in vendor chunks and reintroduce the 74ece28df production regression, and the
polyfill would not catch it.

**Fix:** pick one of these:
1. Delete `src/polyfill.ts` and its import. The define plus env.mjs already give full coverage, and
   this also clears the file's two backlog-999.8 findings. Or:
2. Keep it, but say in the file what it does and does not cover, and stop describing it as paired
   with the define:
   ```ts
   // Runtime alias for code that reads `global` dynamically after startup. This does NOT protect
   // module-scope `global` references in dependencies: in production those are rewritten by the
   // `define` in vite.config.ts (bundled chunks evaluate before this line), and in dev Vite's
   // env prelude sets `global` first. Do not remove the define on the assumption this covers it.
   ```

---

### Info

#### IN-01: The new comment implies every worker realm is covered, but the dev service worker gets neither mechanism

**File:** `vite.config.ts:42-44`
**Classification:** INFO (pre-existing gap, unchanged by this diff)

The plan's threat model and the new comment present `globalThis` as covering "workers and the
service worker". That is true in production, where vite-plugin-pwa forwards `define` into the SW
build. In dev (`devOptions.enabled: true`, `type: "module"`), vite-plugin-pwa serves `sw.ts` through
the normal Vite transform pipeline (`node_modules/vite-plugin-pwa/dist/index.js:531-553`). That
pipeline gets **no** define rewrite (the client-consumer early return) and **no** `/@vite/env`
prelude, which `webWorkerPlugin` adds only to `?worker_file` dedicated workers. So `global` is
undefined in the dev SW, whatever the define says. This does no harm today: the only `global`
reference in the SW graph is Capacitor's `typeof`-guarded fallback chain. But if a dependency with a
bare `global` is added to the SW, it will throw in dev only. That is the same dev/prod split this plan
just debugged.

**Fix:** narrow the comment to what is true, e.g. append: "The dev service worker gets neither this
rewrite nor the env prelude, so `global` is undefined there under `pnpm dev`."

---

## Verified Clean (checked, no finding)

- **Prelude fix reproduced independently.** I evaluated the real `node_modules/vite/dist/client/env.mjs`
  in an empty `vm` context: `{"global": window}` throws `window is not defined`, and
  `{"global": globalThis}` succeeds with `global === globalThis`.
- **No main-thread behaviour change.** `globalThis === window` on the main thread. This holds both
  for the dev runtime alias and for the prod build-time rewrite.
- **The polyfill's own member access is not rewritten.** The built output keeps
  `globalThis.global||=globalThis` verbatim. The define does not mangle it into
  `globalThis.globalThis` or similar.
- **Prod worker bundles unaffected.** The miner bundle is still `miner-CpFg6wop.js` (IIFE, no
  `@vite/env`). The `@snort/worker-relay` and sqlite worker bundles contain no bare `global`, so the
  value change cannot alter them.
- **SW witnesses are meaningful.** If the define were removed, `dist/sw.js` would contain Capacitor's
  raw `typeof global !== "undefined" ? global : {}` tail and the summary's zero-count grep would fail.
  The positive witness (substring of `dist/sw.js:4764`) matches. `dist/` is dated 12:33 local, which is
  after `73668e40e` (12:30), so it reflects HEAD.
- **Build targets.** `globalThis` and `||=` are both supported in every configured target. No
  downlevelling or polyfill is needed.
- **Scope discipline.** `git diff a42dbdcf4 HEAD` on the two files shows only the stated lines. The
  old value is gone from code, and no PoW source file was touched by these commits.

---

_Reviewed: 2026-10-01T17:38:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
