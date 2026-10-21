// aislop-ignore-file ai-slop/console-leftover -- this command reports processing measurements as JSON on stdout
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { finalizeEvent, getPublicKey, nip19 } from "nostr-tools";
import ts from "typescript";
import { compileTypescript, loadTypescript } from "./load-typescript.mjs";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "HEAD" },
    count: { type: "string", default: "1000" },
    runs: { type: "string", default: "5" },
  },
});
const count = Number(values.count);
const runs = Number(values.runs);
if (!Number.isSafeInteger(count) || !Number.isSafeInteger(runs) || count < 1 || runs < 1)
  throw new Error("Invalid count or runs");
const base = execFileSync("git", ["rev-parse", values.base], { encoding: "utf8" }).trim();
const original = execFileSync("git", ["show", `${base}:src/services/notifications/threads.ts`], { encoding: "utf8" });
const start = original.indexOf("export function processThreadNotification");
const end = original.indexOf("function filterThreadNotificationsByMutes", start);
if (start < 0 || end < 0) throw new Error("Choose a --base commit containing the original per-event thread grouping");
const stateToList = execFileSync("git", ["show", `${base}:src/views/notifications/threads/helpers.ts`], {
  encoding: "utf8",
});
const helperUrl = new URL("../src/helpers/nostr/notifications.ts", import.meta.url);
const helpers = await compileTypescript(helperUrl);
const legacyCode = ts.transpileModule(`${original.slice(start, end)}\n${stateToList}`, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
}).outputText;
const moduleCode = `import {insertEventIntoDescendingList} from ${JSON.stringify(import.meta.resolve("applesauce-core/helpers"))};\nimport {getThreadRoot,getThreadRootKey} from ${JSON.stringify(helpers)};\n${legacyCode}`;
const legacy = await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString("base64")}`);
const { getSocialNotifications } = await loadTypescript(helperUrl);
const ownKey = new Uint8Array(32).fill(1);
const otherKey = new Uint8Array(32).fill(2);
const user = getPublicKey(ownKey);
const roots = Array.from({ length: 50 }, (_, i) =>
  finalizeEvent({ kind: 1, content: `Root ${i}`, tags: [], created_at: i }, ownKey),
);
const replies = Array.from({ length: count }, (_, index) => {
  const root = roots[index % roots.length];
  return finalizeEvent(
    {
      kind: 1,
      created_at: count + 100 - index,
      content: `Note ${index} nostr:${nip19.npubEncode(user)}`,
      tags: [
        ["p", user],
        ["e", root.id, "", "root"],
        ["e", root.id, "", "reply"],
      ],
    },
    otherKey,
  );
});
const rows = [];
for (let round = 0; round < runs; round++) {
  for (const method of round % 2 ? ["snapshot", "legacy"] : ["legacy", "snapshot"]) {
    const started = performance.now();
    let groups;
    if (method === "legacy") {
      let state = { threadGroups: new Map() };
      for (const event of replies) {
        state = legacy.processThreadNotification(state, event);
        groups = legacy.getNotificationsFromState(state);
      }
    } else groups = getSocialNotifications([...replies, ...roots.toReversed()], user).threads;
    const elapsedMs = performance.now() - started;
    const ids = groups.flatMap((group) => group.data.replies.map((event) => event.id));
    if (new Set(ids).size !== count || replies.some((event) => !ids.includes(event.id)))
      throw new Error("Grouping lost events");
    rows.push({ method, round: round + 1, elapsedMs, groups: groups.length, events: ids.length });
  }
}
const summary = ["legacy", "snapshot"].map((method) => {
  const samples = rows
    .filter((row) => row.method === method)
    .map((row) => row.elapsedMs)
    .sort((a, b) => a - b);
  return {
    method,
    samples: samples.length,
    medianMs: samples[Math.floor(samples.length / 2)],
    p95Ms: samples[Math.ceil(samples.length * 0.95) - 1],
    projectionsPerBurst: method === "legacy" ? count : 1,
  };
});
console.log(
  JSON.stringify(
    {
      base,
      node: process.version,
      count,
      threads: roots.length,
      scope:
        "CPU only; original thread grouping on every event versus one shared social snapshot, including reply/mention/quote classification; excludes store insertion and React rendering",
      batchDelayMs: 100,
      summary,
      rows,
    },
    null,
    2,
  ),
);
