---
phase: quick-260819-ksr
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/helpers/nostr/napplets.ts
  - src/hooks/use-napplet-history.ts
  - src/components/napplets/napplet-history-drawer.tsx
  - src/components/napplets/napplet-frame.tsx
autonomous: true
requirements: [QUICK-260819-ksr]

must_haves:
  truths:
    - "The info button on a running napplet page opens a right-side drawer titled 'Version history' instead of navigating away to the store detail page."
    - "The drawer lists every historical version of the napplet's coordinate returned by relays, newest first, each with a timestamp and the relays it was seen on."
    - "Clicking a historical version in the drawer reloads the running iframe with that version's index.html (resolved from that version's own content-addressed blobs)."
    - "While a historical version is active, the napplet header shows a visible 'viewing historical version' indicator with a one-click return to the latest version."
    - "The drawer still offers a link to the full app details page (/app/store/<naddr>) so the previous info-button destination is not lost."
  artifacts:
    - src/hooks/use-napplet-history.ts
    - src/components/napplets/napplet-history-drawer.tsx
  key_links:
    - "getNappletHistoryFilter(event) -> useNappletHistory -> pool.request(relays, [filter], { eventStore: null }) — deduplication MUST stay disabled or only the newest version is ever returned."
    - "NappletHistoryDrawer onSelect(version) -> NappletFrame active-version state -> resolveNapplet({ event: active }) -> iframe srcdoc."
---

<objective>
Add an internet-archive style historical rewind for napplets: the info button on the napplet page opens a drawer listing every historical version of the napplet's replaceable-event coordinate (fetched with deduplication disabled so relays can return overwritten versions), and selecting one re-resolves and reloads the running napplet from that version's manifest.

Purpose: napplet manifests are replaceable events; relays that retain old versions already hold the full release history. Surfacing it lets a user roll back a napplet that regressed, and inspect what a napplet used to be, without leaving the running app.
Output: one new hook, one new drawer component, a new filter helper, and rewind wiring in the existing napplet frame.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
Existing files that MUST be read before editing (all verified to exist):

@src/components/napplets/napplet-frame.tsx
  The running-napplet component. Owns manifest resolution (`resolveNapplet`), consent, shell frame
  registration, the `reload` action, and the `actions` ButtonGroup where the info `IconButton`
  currently renders as a RouterLink to `/app/store/${address}`.

@src/hooks/use-list-history.ts
  THE reference implementation for this feature. It already does the exact relay query pattern
  requested: `pool.request(relays, [filter], { eventStore: null })` (the `eventStore: null` option
  is what disables replaceable-event deduplication), merges duplicate ids while unioning
  `getSeenRelays` hints via `addSeenRelay`, sorts newest-first, and `defaultIfEmpty([])` so the
  consumer can distinguish "in flight" (undefined) from "none found" (empty array).
  Mirror this file's structure closely.

@src/helpers/nostr/napplets.ts
  Napplet helpers. Already exports `getNappletTitle`, `getNappletNaddr`, `getNappletDTag`,
  `isNappletManifestKind`, and re-exports the three kinds.

@src/helpers/nostr/list-history.ts
  Shows the addressable-vs-replaceable filter branch (`getListHistoryFilter`) that the napplet
  filter mirrors.

@src/views/lists/components/list-history-modal.tsx
  Existing version-history UI conventions (Timestamp usage, loading spinner copy, empty state,
  "Current" badge, Stack + StackDivider row layout).

@src/views/tools/event-console/history-drawer.tsx
  Existing right-side Drawer conventions: `<Drawer isOpen placement="right" size="md">` +
  Overlay/Content/CloseButton/Header/Body, `ClockRewind` icon in the header, and the
  `Omit<DrawerProps, "children">` prop-type pattern.

Reference facts already confirmed — do NOT re-derive:
- Napplet kinds: 5129 snapshot (regular, immutable, NO history), 15129 root (replaceable, no `d` tag),
  35129 named (addressable, has `d` tag). `isReplaceable` from applesauce-core returns true for
  15129 and 35129 only.
- `resolveNapplet({ event, cache, fetchBlob })` resolves whatever event it is handed; blobs are
  content-addressed by sha256 and the artifact cache is keyed by blob hash, so passing an older
  manifest event correctly yields that version's `index.html`. No cache invalidation work is needed.
- `getNappletNaddr(event)` returns undefined for kind 15129 (no `d` tag), so `address` can be
  undefined while history is still available.
- There is no test runner in this repo (no vitest/jest, no `test` script). The typecheck gate is
  `npx tsc -p tsconfig.json` (tsconfig already sets `noEmit: true`).
- Chakra UI v2 + `use$` from `applesauce-react/hooks` + `onlyEvents` from `applesauce-relay` are the
  established conventions. Do not add dependencies.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add napplet history filter helper and the non-deduplicated history hook</name>
  <files>src/helpers/nostr/napplets.ts, src/hooks/use-napplet-history.ts</files>
  <action>
    In `src/helpers/nostr/napplets.ts`, add and export `getNappletHistoryFilter(event: NostrEvent): Filter | undefined`.
    Import `Filter` as a type from `nostr-tools` (the file already imports `NostrEvent` from there) and
    `isAddressableKind` from `nostr-tools/kinds`. Behaviour:
      - Addressable kind (35129): return kinds/authors/`#d` scoped to `getNappletDTag(event)`.
      - Replaceable-but-not-addressable kind (15129): return kinds/authors only.
      - Anything else (snapshot 5129 and non-napplet kinds): return undefined — a regular event has no
        replaceable history to rewind through. Use the existing `isReplaceable` import already present
        at the top of the file to make this branch.
    Give it a short doc comment explaining that the returned filter intentionally matches the whole
    coordinate so relays that retain overwritten versions can answer with more than one event.

    Create `src/hooks/use-napplet-history.ts` exporting a default `useNappletHistory(event?: NostrEvent)`
    hook modelled directly on `src/hooks/use-list-history.ts`. Requirements:
      - Relay set: `relaySet(mailboxes?.inboxes, mailboxes?.outboxes, getSeenRelays(event))` from
        `useUserMailboxes(event?.pubkey)` plus `getSeenRelays` of the passed event, fed through
        `useReadRelays(additional)` from `src/hooks/use-client-relays.ts`. Wrap the additional set in
        `useMemo`. Including the seen-relays of the current event matters: the relay that served the
        napplet is the relay most likely to still hold its older versions.
      - Query: `pool.request(relays, [filter], { eventStore: null })` piped through `onlyEvents()`.
        Keeping `eventStore: null` is load-bearing — routing through the event store collapses
        replaceable events to the newest one and the feature silently returns a single version.
      - Accumulate with `scan` into a `Map<string, NostrEvent>` keyed by `event.id`, and when an id is
        already present union its relay hints onto the stored event with `addSeenRelay` (same as the
        list-history hook) so the drawer can show every relay that served a version.
      - Emit newest-first via `map` + a `created_at` descending sort, then `defaultIfEmpty([])`.
      - Return `of([])` early when `event` is undefined, and return `of(undefined)` semantics are NOT
        needed — instead return `undefined` from `use$` naturally while in flight. Guard the whole
        observable behind `if (!event) return of([] as NostrEvent[])` and
        `const filter = getNappletHistoryFilter(event); if (!filter) return of([] as NostrEvent[])`.
      - `use$` dependency array: `[event?.id, relays.join(",")]` (mirrors the list-history hook).
      - Return `{ versions, relays }` where `versions` is `NostrEvent[] | undefined`.
    Document at the top of the file, in one short comment, that `undefined` means the request is still
    in flight and `[]` means no versions were returned.
  </action>
  <verify>
    <automated>npx tsc -p tsconfig.json && grep -c "eventStore: null" src/hooks/use-napplet-history.ts && grep -c "getNappletHistoryFilter" src/helpers/nostr/napplets.ts</automated>
  </verify>
  <done>
    `npx tsc -p tsconfig.json` exits 0. `getNappletHistoryFilter` returns a `#d`-scoped filter for kind
    35129, an author+kind filter for 15129, and undefined for 5129. `useNappletHistory` issues a single
    pool.request with deduplication disabled and returns versions sorted newest-first with unioned
    relay hints.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build the napplet history drawer</name>
  <files>src/components/napplets/napplet-history-drawer.tsx</files>
  <action>
    Create `src/components/napplets/napplet-history-drawer.tsx` exporting a default
    `NappletHistoryDrawer`. Props:
      `Omit<DrawerProps, "children"> & { event: NostrEvent; active: NostrEvent; onSelect: (version: NostrEvent) => void }`
    where `event` is the latest/canonical manifest event and `active` is the version currently running
    in the iframe (they are the same object until the user rewinds).

    Follow `src/views/tools/event-console/history-drawer.tsx` for the shell:
    `<Drawer isOpen placement="right" size="md">` + `DrawerOverlay` / `DrawerContent` /
    `DrawerCloseButton` / `DrawerHeader` / `DrawerBody`, with the `ClockRewind` icon from
    `src/components/icons/clock-rewind.tsx` in the header next to the text "Version history".
    Under the header title render `getNappletTitle(event)` in small GrayText.

    Body contents, top to bottom:
      1. A short GrayText line naming the napplet's coordinate kind so the user understands what is
         being searched — render `getNappletNaddr(event)` truncated when present.
      2. When `getNappletNaddr(event)` is defined, a ghost `Button` `as={RouterLink}` to
         `/app/store/${address}` labelled "App details". This preserves the destination the info
         button used to navigate to.
      3. The version list from `useNappletHistory(event)`:
         - `versions === undefined` -> centred `<Spinner />` with the text
           "Searching relays for older versions…" (match the list-history-modal copy).
         - empty array -> centred GrayText "No other versions found." plus a GrayText hint that most
           relays only keep the newest version of a replaceable event.
         - otherwise a `Stack` with `StackDivider` where each row renders:
           `<Timestamp timestamp={version.created_at} />` (from `src/components/timestamp.tsx`),
           a truncated monospace `version.id.slice(0, 8)`,
           `<SeenOnRelaysButton event={version} size="xs" variant="ghost" />`
           (from `src/components/note/seen-on-relays-button.tsx`),
           a green "Latest" `Badge` when `version.id === event.id`,
           a blue "Viewing" `Badge` when `version.id === active.id`,
           and, when `version.id !== active.id`, a right-aligned primary `Button` size="sm" labelled
           "Load" that calls `onSelect(version)` then `onClose()`.
    Keep every row keyed by `version.id`.

    Do not fetch or resolve anything in this component — it is presentation plus the hook call only.
    The `active` prop exists solely so a row can be badged and its Load button suppressed.
  </action>
  <verify>
    <automated>npx tsc -p tsconfig.json && grep -c "useNappletHistory" src/components/napplets/napplet-history-drawer.tsx && grep -c "SeenOnRelaysButton" src/components/napplets/napplet-history-drawer.tsx</automated>
  </verify>
  <done>
    The drawer typechecks, renders the three states (loading / empty / list), badges the latest and the
    currently-viewed version, exposes an "App details" link when the napplet has an naddr, and calls
    `onSelect` + `onClose` when a non-active version's Load button is pressed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Wire rewind into the running napplet frame</name>
  <files>src/components/napplets/napplet-frame.tsx</files>
  <action>
    Modify `src/components/napplets/napplet-frame.tsx` to run a selected historical version.

    State and derived values:
      - Add `const [version, setVersion] = useState<NostrEvent>()` holding the selected historical
        manifest, and `const active = version ?? event`.
      - Add a `useEffect` that clears `setVersion(undefined)` whenever `event.id` changes, so
        navigating to a different napplet never leaves a stale rewind active.
      - Add `const history = useDisclosure()` from `@chakra-ui/react` for the drawer.
      - Compute `const canRewind = !!getNappletHistoryFilter(event)` so the button is hidden for
        snapshot (kind 5129) napplets that have no replaceable history.

    Resolution and shell wiring — replace `event` with `active` in exactly these places, and nowhere else:
      - The resolve effect: `getNappletRequiredCapabilities(active)`, `getUnsupportedNappletRequirements(active)`,
        `resolveNapplet({ event: active, ... })`, the `identity` `pubkey`, and `requestConsent(active, ...)`.
        Add `active` to that effect's dependency array in place of `event`.
      - `setIframe`: the `windowId` template and `registerFrame` identity `pubkey` must use `active`
        (a rewound version has a different aggregateHash and must register as a distinct frame).
        Update the callback's dependency array accordingly.
      - Derive `title` from `active` so the header reflects the running version.

    Leave `event` in place for: the `address` used by `getNappletNaddr`, the install button
    (`installNapplet(event, address)` must always install the latest), and the `event` prop handed to
    the history drawer.

    A rewind must behave exactly like a reload: create a `selectVersion` callback that unregisters the
    current frame (`unregisterFrame(windowIdRef.current)`), disposes `deliveryRef.current`, resets
    `windowIdRef` / `deliveryRef` / `deliveredKeyRef` the same way the existing `reload` callback does,
    calls `setVersion(next.id === event.id ? undefined : next)`, and bumps `setReloadKey`. Factor the
    shared teardown out of `reload` into a small helper so the two paths cannot drift.

    Header actions ButtonGroup:
      - Replace the current info `IconButton` (the RouterLink to `/app/store/${address}`) with an
        `IconButton` that keeps the `InfoIcon` and calls `history.onOpen`. Its Tooltip label and
        aria-label become "Version history". Render it whenever `canRewind` is true — note it must NOT
        be gated on `address`, because kind 15129 napplets have no naddr but do have history.
      - Render `<NappletHistoryDrawer isOpen={history.isOpen} onClose={history.onClose} event={event}
        active={active} onSelect={selectVersion} />` inside the returned tree.

    Historical-version indicator: when `version` is set, render a Chakra `Alert status="info"` bar
    directly above the iframe stating that a historical version from `<Timestamp>` is running, with a
    right-aligned ghost `Button` labelled "Back to latest" that calls `selectVersion(event)`.

    Do not change the sandbox attributes, the namespace prelude injection, or the intent delivery logic.
  </action>
  <verify>
    <automated>npx tsc -p tsconfig.json && grep -c "NappletHistoryDrawer" src/components/napplets/napplet-frame.tsx && grep -c "event: active" src/components/napplets/napplet-frame.tsx && grep -c "installNapplet(event" src/components/napplets/napplet-frame.tsx</automated>
    <human-check>
      1. `pnpm dev`, open a running napplet at `/app/<naddr>`.
      2. Click the info button in the header — the Version history drawer slides in from the right.
      3. Confirm the newest entry is badged "Latest" and "Viewing", and that relay hints show under the
         relay icon popover.
      4. If the relays return an older version, click "Load" — the iframe reloads with the old
         index.html and the blue "viewing a historical version" bar appears above it.
      5. Click "Back to latest" — the latest version runs again and the bar disappears.
    </human-check>
  </verify>
  <done>
    The info button opens the history drawer instead of navigating away; selecting a historical version
    re-resolves and re-renders the iframe from that version's manifest with a fresh shell frame
    registration; an info bar with "Back to latest" is visible while rewound; installing still installs
    the latest event; `npx tsc -p tsconfig.json` exits 0.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| relay -> client | Relays return arbitrary events claiming to be historical napplet manifests |
| historical manifest -> iframe | An older manifest's blobs become executable `srcdoc` in the napplet sandbox |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-ksr-01 | Spoofing | useNappletHistory results | high | mitigate | The filter pins `kinds` + `authors` (+ `#d`), and every selected version still goes through `resolveNapplet`, which verifies the manifest signature, the NIP-5A aggregate, and each blob hash before any bytes reach the iframe. A forged version fails closed with a NappletResolutionError surfaced in the existing error Alert. |
| T-ksr-02 | Elevation of Privilege | rewound iframe | high | mitigate | Task 3 routes the historical event through the unchanged `requestConsent(active, identity, capabilities)` path with the historical version's own aggregateHash, so a rewind cannot silently inherit consent granted to the latest build. Sandbox attributes and the namespace prelude are explicitly out of scope for modification. |
| T-ksr-03 | Tampering | shell frame registry | medium | mitigate | `windowId` and `registerFrame` identity are switched to the active version so a rewound frame registers distinctly and the previous frame is unregistered during teardown, preventing message routing to a stale window. |
| T-ksr-04 | Denial of Service | pool.request fan-out | low | accept | The history query is a one-shot `pool.request` over the user's existing read relays plus the event's seen relays, opened only when the drawer is rendered. Same shape and cost as the shipped list-history query. |
</threat_model>

<verification>
- `npx tsc -p tsconfig.json` exits 0 (repo has no test runner; this is the compile gate).
- `grep -rn "eventStore: null" src/hooks/use-napplet-history.ts` matches — deduplication stays disabled.
- No new dependency added: `git diff --stat package.json` is empty.
- `grep -rn "app/store/" src/components/napplets/napplet-frame.tsx` no longer matches on the header
  IconButton; the store link now lives in the drawer.
</verification>

<success_criteria>
- Info button on a running napplet opens a right-side "Version history" drawer.
- The drawer queries the napplet's coordinate with replaceable-event deduplication disabled and lists
  every distinct version returned, newest first, with timestamps and per-version relay hints.
- Selecting a historical version reloads the running napplet from that version's verified index.html.
- A visible indicator plus "Back to latest" is present while a historical version is running.
- App details remain reachable from inside the drawer.
</success_criteria>

<output>
Create `.planning/quick/260819-ksr-add-historical-version-rewind-for-napple/260819-ksr-SUMMARY.md` when done
</output>
