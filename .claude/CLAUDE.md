@AISLOP.md

## noStrudel overrides for aislop hook feedback

These override the aislop guidance imported above wherever they differ. `AGENTS.md` is the canonical project guide.

- Config lives in `.aislop/config.yml` and `.aislop/rules.yml` (not `.yaml`). aislop does not read the `.yaml` names.
- Hook findings are feedback only (D-16), not blocking. Fix findings your own change introduces. Do not sweep pre-existing findings in touched files; those belong to backlog phases 999.2–999.10.
- Rule-scoped `aislop-ignore-*` directives that name the rule and end with `-- reason` are allowed (`AGENTS.md` "Inline ignores", D-12). Bare directives without a rule or a reason are not.
- Where this file or `AISLOP.md` differs from `AGENTS.md`, follow `AGENTS.md`.
