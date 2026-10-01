---
status: awaiting_human_verify
trigger: "PoW workers fail to load: worker pool mines zero hashes; console shows 8x `ReferenceError: window is not defined` at vite/dist/client/env.mjs:8 and 4x `Dropped napplet message ... reason: unregistered-window` (adapter.ts:138). User suspects nostr-wasm fails to load in the workers."
created: 2026-10-01T00:00:00Z
updated: 2026-10-01T17:31:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

hypothesis: CONFIRMED — vite.config.ts:41-44 (line 43) `define: { global: "window" }` is serialized raw into Vite's dev `/@vite/env` module as `const defines = {"global": window};`; Vite prepends `import "/@vite/env"` to every `?worker_file&type=module` worker in dev; evaluating `window` in a DedicatedWorkerGlobalScope throws ReferenceError at env.mjs:8, aborting module evaluation, so miner.ts never installs `self.onmessage` and every worker silently drops the {draft,target} message.
test: done (Experiment A reproduces exact error from real config; Experiment B proves prod worker mines without window)
expecting: n/a
next_action: UAT re-run (/gsd-verify-work 04) — restart `pnpm dev`, hard-reload the tab so /@vite/env is refetched, then run test 2 in both composers (no `window is not defined`, progress advances, "Found POW", note publishes), test 4, the ~800ms post-"Found POW" window of test 3, and the zero-hashes note on test 1. The falsification test below is decided by that re-run.
reasoning_checkpoint:
  hypothesis: "Dev miner workers crash at load because the `global: \"window\"` define is emitted verbatim into the /@vite/env prelude Vite injects into module workers, and `window` does not exist in worker scope."
  confirming_evidence:
    - "Vite 8.1.5 handleDefineValue returns string define values raw; clientInjectionsPlugin substitutes them into env.mjs line 8 (`const defines = __DEFINES__`) — the exact reported line."
    - "webWorkerPlugin transform prepends `import \"/@vite/env\"` for worker_file&type=module; workerImportMetaUrlPlugin rewrites mine-pow.tsx:55's URL to that form in dev."
    - "Experiment A: real resolved config → `ReferenceError: window is not defined at env.mjs:8` in worker-like scope; OK in window scope; OK with `globalThis`."
    - "Experiment B: same miner.ts as built for prod mines difficulty 10 in 61ms without window."
  falsification_test: "If, in `pnpm dev` with `global: \"globalThis\"`, workers still log ReferenceError or still mine zero hashes, the hypothesis is incomplete (another dev-only window reference in the worker graph)."
  fix_rationale: "Changing the define value to an identifier that exists in every JS global scope removes the throw at its source, and keeps main-thread semantics because globalThis === window there. It also keeps the 74ece28df rolldown `global` fix working in prod builds."
  blind_spots: "Not observed in a real browser (dev server intentionally not started). @vitejs/plugin-react 6 refresh wrapper (native rolldown plugin) assumed not to wrap miner.ts. Firefox's reported column (18) does not land on the `window` token in the served text (col 28); line 8 can only throw from a raw define value, so this is treated as a column-reporting/sourcemap quirk."

## Symptoms

expected: With PoW difficulty above 0, MinePOW mounts and shows progress; the worker pool mines hashes; on completion the note is signed and published; the composer returns to a normal state. Applies to both composers (src/views/new/note/short-text-form.tsx, src/components/post-modal/index.tsx).
actual: Worker pool mines zero hashes; mining never completes. Progress UI and Cancel/Skip render (MinePOW mounts, fixed in 04-12/04-13).
errors: |
  Dropped napplet message  Object { type: undefined, origin: "http://localhost:5173", reason: "unregistered-window" }   adapter.ts:138:40   (x4)
  ReferenceError: window is not defined   env.mjs:8:18
      <anonymous> http://localhost:5173/node_modules/.pnpm/vite@8.1.5_.../node_modules/vite/dist/client/env.mjs:8
  ReferenceError: window is not defined   (8 total, likely one per spawned miner worker)
reproduction: Test 2 in .planning/phases/04-dead-code-and-import-hygiene-sweep/04-UAT.md — `pnpm dev` (Vite 8.1.5), sign in, compose note, set PoW difficulty > 0, submit, in either composer.
started: Discovered during UAT round 2 on 2026-10-01. Path was unreachable for ~15 months before 04-12 (MinePOW never mounted), so no known-good recent baseline.

## Eliminated

- hypothesis: nostr-tools is aliased/swapped to a nostr-wasm-backed implementation in the worker, and nostr-wasm fails to load there.
  evidence: No vite alias for nostr-tools; tsconfig paths only map `~/*`. nostr-tools "." export → lib/esm/index.js, which has zero nostr-wasm imports. Dev optimizer closure for nostr-tools.js is pure @noble/@scure. nostr-wasm appears only in src/services/verify-event.ts (main thread).
  timestamp: 2026-10-01T00:12:00Z

- hypothesis: The "Dropped napplet message" events are the miner workers' messages being intercepted by the @kehto/shell window listener (and the shell interference prevents mining).
  evidence: Dedicated-worker messages fire on the Worker object, not window; the shell only listens on window. Workers crash before posting anything. 4 events vs 8 workers. Drop path requires a non-null source window. Logged only via DEV console.debug and does not affect delivery to worker.onmessage.
  timestamp: 2026-10-01T00:16:00Z

- hypothesis: A bug in miner.ts / mine-pow.tsx worker logic (wrong message shape, bad nonce loop) prevents hashing.
  evidence: Experiment B: the production bundle of the same miner.ts installs self.onmessage and completes difficulty 10 in 61ms with 8 progress messages, given exactly the {draft, target, startNonce, endNonce} shape mine-pow.tsx:58 sends.
  timestamp: 2026-10-01T00:25:00Z

- hypothesis: Production builds share the defect (worker bundle rewrites `global`→`window` or includes env prelude).
  evidence: dist/assets/miner-CpFg6wop.js is a self-contained IIFE with no imports, no /@vite/env, no free window/global; clientInjectionsPlugin only applies to non-bundled environments. Experiment B ran it successfully without window.
  timestamp: 2026-10-01T00:25:00Z

## Evidence

- timestamp: 2026-10-01T00:05:00Z
  checked: node_modules/vite (8.1.5) dist/client/env.mjs
  found: Line 8 is `const defines = __DEFINES__;` — the exact line:col of the reported ReferenceError (env.mjs:8:18). Lines 9-17 assign each define onto globalThis.
  implication: The throw happens while evaluating the define table itself, before any app code.

- timestamp: 2026-10-01T00:06:00Z
  checked: vite dist/node/chunks/node.js — clientInjectionsPlugin (~L24826) and serializeDefine/handleDefineValue (~L24802-24817)
  found: `__DEFINES__` is replaced by serializeDefine(userDefine). handleDefineValue returns string values RAW ("keeps raw string values as a literal ... `\"window\"` would refer to the global `window` object directly"). Plugin applies only to non-bundled (dev) environments.
  implication: With vite.config.ts `define: { global: "window" }`, dev env.mjs line 8 becomes `const defines = {"global": window};` — a free reference to `window`.

- timestamp: 2026-10-01T00:07:00Z
  checked: vite node.js workerImportMetaUrlPlugin (~L28030-28090) and webWorkerPlugin transform (~L27142-27160)
  found: `new Worker(new URL("./miner.ts", import.meta.url), { type: "module" })` matches workerImportMetaUrlRE; in dev (not bundled) the URL is rewritten to `/src/components/pow/miner.ts?worker_file&type=module`. The webWorkerPlugin transform, filtered on workerFileRE, prepends `import "/@vite/env"` for workerType "module" (`importScripts("/@vite/env")` for classic).
  implication: Every miner worker imports env.mjs before its own body. In a DedicatedWorkerGlobalScope `window` is undeclared → ReferenceError during module evaluation → miner.ts never reaches `self.onmessage = ...` → the `{draft,target}` postMessage from mine-pow.tsx:58 has no listener → zero hashes. One error per worker matches 8 errors for navigator.hardwareConcurrency workers (mine-pow.tsx:51-59).

- timestamp: 2026-10-01T00:10:00Z
  checked: git log -S 'global: "window"' / -G define on vite.config.ts; git show 74ece28df
  found: The only `define` block ever in vite.config.ts was added in 74ece28df (2026-04-29, "Fix rolldown package referencing `global`") together with @vitejs/plugin-react 4→6 and src/polyfill.ts `window.global ||= window`. miner.ts dates from c685b576e (2024-04-29); last functional edit fff8a1d8a (2024-09-12).
  implication: Dev worker breakage began 2026-04-29. It was masked because MinePOW could not mount between 2025-06-02 (124345b25) and 04-12 (2026-09-17), so 04-12 is the first time the workers were spawned since the define landed.

- timestamp: 2026-10-01T00:12:00Z
  checked: nostr-tools 2.23.5 package.json exports + lib/esm/index.js imports; free `global` identifier grep across @noble/curves 2.0.1, @noble/hashes 2.0.1, @noble/ciphers 2.1.1, @scure/base 2.0.0
  found: `nostr-tools` "." resolves to lib/esm/index.js, which imports only @noble/* and @scure/base; zero occurrences of `nostr-wasm` in it (nostr-wasm is a dependency only for the separate `nostr-tools/wasm` subpath). No tsconfig path/vite alias redirects nostr-tools. Zero free `global` identifiers in the worker's dependency graph.
  implication: The user's "nostr-wasm fails to load in the workers" is an inference from the symptom; nostr-wasm is not in the worker graph. Nothing in the worker graph needs the `global` define at all.

- timestamp: 2026-10-01T00:14:00Z
  checked: /home/robert/Projects/noStrudel/dist/assets/miner-CpFg6wop.js (prod build from 2026-10-01 10:35, 96 KB)
  found: Self-contained IIFE (Vite default worker.format "iife"), no import statements, no `/@vite/env`, no free `window` (only the string "invalid window size" from noble), no `global`. Tail is the current miner.ts body (`self.onmessage=...`, `e>=n` break).
  implication: The env.mjs injection is dev-only (clientInjectionsPlugin applyToEnvironment = !isBundled) and the static `global`→`window` rewrite has no target in the worker bundle, so production builds are NOT affected by this mechanism.

- timestamp: 2026-10-01T00:16:00Z
  checked: src/services/napplet-shell/adapter.ts:137-139, src/providers/global/napplet-shell-provider.tsx:110-111, @kehto/shell 0.21.2 dist/index.js:1165-1208
  found: The provider attaches `bridge.handleMessage` to `window` "message" (app-global). handleMessage calls reportUnrouted(..., "unregistered-window") for any MessageEvent whose `event.source` is a non-null window not in originRegistry; `type` is reported only when `event.data.type` is a string. The app hook logs it via `console.debug` only when `import.meta.env.DEV`. No app code on the composer/PoW path calls `window.postMessage` (grep of src: only napplet-intent-delivery, webxdc iframes, SW registration, and the miner's own worker-scope postMessage).
  implication: Worker messages are delivered to the Worker object (mine-pow.tsx:56 `worker.onmessage`), never to `window`, so the shell cannot see them; the workers also never run their body, so they post nothing. Count mismatch (4 vs 8 workers) further rules out a 1:1 link. The 4 events are same-origin window messages with a source window and no string `type` — consistent with a NIP-07 signer extension's page<->content-script bridge (e.g. Alby posts `{application:"LBE", ...}` request + response, 2 per call; createDraft resolves the pubkey/signs) or React DevTools' window bridge. UNRELATED to the PoW failure; DEV-only debug noise.

- timestamp: 2026-10-01T00:22:00Z
  checked: EXPERIMENT A — scratchpad/exp-a-env.mjs. Ran vite.resolveConfig (no server, configLoader native) on the real vite.config.ts, took the client environment define, applied Vite's exact serializeDefine + clientInjections filter to the real dist/client/env.mjs, evaluated via node:vm in (a) a worker-like global (self, no window) and (b) a window-like global.
  found: |
    resolved client define: {"global":"window"}
    [worker scope, current config] THROW ReferenceError: window is not defined  at env.mjs:8
            line8=const defines = {"global": window};
    [main-thread scope, current config] OK
    [worker scope, global:'globalThis'] OK   line8=const defines = {"global": globalThis};
    [worker scope, no global define] OK      line8=const defines = {};
  implication: Exact reproduction of the user's error text and line (env.mjs:8) from the real config. The main thread is unaffected (window exists), which is why only workers fail. Changing the define value to "globalThis" (or removing it) makes env.mjs evaluate cleanly in worker scope.

- timestamp: 2026-10-01T00:25:00Z
  checked: EXPERIMENT B (positive control) — scratchpad/exp-b-prod-miner.mjs. Evaluated dist/assets/miner-CpFg6wop.js in a vm global with self/postMessage/crypto and NO window; posted {draft, target:10} (materialised in the worker realm, as structured clone would).
  found: `typeof self.onmessage after load: function | window defined: false`; 8 progress messages; `complete in 61ms id=0003b677...` nonce tag ["nonce","3754","10"]. (A first attempt that passed an outer-realm object failed nostr-tools validateEvent's record check — a harness artifact, fixed by creating the payload inside the context.)
  implication: miner.ts logic and nostr-tools hashing work in a window-less worker scope. Production workers load and mine. The worker code itself is not the defect; the dev-only env.mjs prelude is.

- timestamp: 2026-10-01T00:28:00Z
  checked: node_modules/.vite/deps (dev optimizer cache, 2026-10-01 11:01) — transitive import closure of nostr-tools.js (9 files) scanned for free window/global/document
  found: Only hits are noble's local `window` loop variables/params (calcOffsets(n, window, ...)) and "invalid window size" strings. No free global references.
  implication: Once env.mjs stops throwing, nothing else in the dev worker graph needs `window`. The env.mjs prelude is the sole blocker in dev. (Residual: @vitejs/plugin-react 6.0.4 refresh wrapper is a native rolldown plugin; it only wraps modules with oxc-emitted $RefreshReg$/$RefreshSig$, which miner.ts — no components/hooks — does not produce.)

- timestamp: 2026-10-01T00:29:00Z
  checked: grep src for nostr-wasm and `new Worker(`
  found: nostr-wasm is used only by src/services/verify-event.ts (main thread, via nostr-tools/wasm + dynamic import("nostr-wasm")). mine-pow.tsx:55 is the only `new Worker(` in src.
  implication: "nostr-wasm failing to load in the PoW workers" (UAT test 4) is a misattribution; the workers never load any nostr code because their first import (/@vite/env) throws.

## Resolution

root_cause: |
  vite.config.ts:41-44 (line 43) — `define: { global: "window" }` (added 2026-04-29 in 74ece28df "Fix rolldown package referencing `global`").
  In dev, Vite's clientInjectionsPlugin serializes user defines into the `/@vite/env` module (vite/dist/client/env.mjs) and emits
  string values verbatim, so env.mjs:8 becomes `const defines = {"global": window};`. Vite's webWorkerPlugin prepends
  `import "/@vite/env"` to every module worker (`?worker_file&type=module`), which is what mine-pow.tsx:55's
  `new Worker(new URL("./miner.ts", import.meta.url), { type: "module" })` becomes in dev. A DedicatedWorkerGlobalScope has no
  `window`, so the prelude throws `ReferenceError: window is not defined` (env.mjs:8) during module evaluation, before miner.ts's
  body runs. `self.onmessage` is never assigned, the {draft, target} message posted at mine-pow.tsx:58 is dropped, and each of the
  navigator.hardwareConcurrency workers (8 on the user's machine → 8 errors) mines zero hashes. MinePOW's UI stays on "Mining POW..." forever.
  Dev-only: production worker bundles are self-contained IIFEs with no env prelude and no `global` references, and they mine correctly.
  Masked for ~5 months because MinePOW could not mount at all (2025-06-02 → 04-12 on 2026-09-17).
  Unrelated: the 4x "Dropped napplet message ... unregistered-window" lines are DEV-only console.debug output from the app-global
  @kehto/shell window "message" listener reacting to non-napplet same-origin window messages (likely a NIP-07 extension bridge);
  worker messages never reach window. nostr-wasm is not in the worker graph.
fix: |
  Plan 04-14. Two one-line source edits. (1) vite.config.ts: the `global` define value changed from the identifier `window` to
  `globalThis` (7ab167469), with a short comment explaining why. globalThis is the window on the main thread and also exists in
  workers and the service worker, so 74ece28df's build-time rewrite is kept and dev env.mjs line 8 no longer references `window`.
  (2) src/polyfill.ts: line 4 changed to `globalThis.global ||= globalThis;` (73668e40e) so both `global` shims name the same
  realm-agnostic object. No PoW source file was modified.
verification: |
  Static evidence only. Runtime confirmation is pending the UAT re-run; nothing has been observed mining in a browser.
  - Prelude check (Vite's real vite:client-inject transform on the real config, evaluated in a window-less vm context): before the
    edit `WORKER_PRELUDE_FAIL window is not defined`, after the edit `WORKER_PRELUDE_OK`.
  - `pnpm build` exits 0 after each edit.
  - dist/sw.js: Capacitor's fallback chain now ends `typeof globalThis !== "undefined" ? globalThis : {}` (count 1); bare
    `typeof global !== "undefined"` count 0, so the define is still applied at build time.
  - Prod miner bundle: exactly one, dist/assets/miner-CpFg6wop.js (same hash as before), 0 references to `@vite/env`.
files_changed: [vite.config.ts, src/polyfill.ts]
