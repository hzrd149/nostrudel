# Deferred Items — quick-260903-dwf

## Pre-existing tsc failures (out of scope)

- `npx tsc --project tsconfig.json --noEmit` fails with ~44 errors in napplet files
  (`src/components/napplets/napplet-frame.tsx`, `src/helpers/nostr/napplets.ts`,
  `src/providers/global/napplet-shell-provider.tsx`).
- Cause: `@kehto/nip`, `@kehto/shell`, `@kehto/services`, `@napplet/core` are declared
  in package.json but not installed in node_modules in this environment
  (`node_modules/@kehto` and `node_modules/@napplet` are missing).
- Not caused by this task: diff is a single string literal in
  `src/views/settings/wallet/add-wallet-modal.tsx`, which itself type-checks clean.
- Suggested fix for the maintainer: `npm install` (or install the declared @kehto/@napplet
  packages) to sync node_modules with package.json, then re-run tsc.
