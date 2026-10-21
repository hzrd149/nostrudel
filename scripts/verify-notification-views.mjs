// aislop-ignore-file ai-slop/console-leftover -- this command reports browser verification results as JSON on stdout
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { finalizeEvent, getPublicKey, nip19 } from "nostr-tools";
import { createNotificationFixture, FIXTURE_USER, startNotificationRelay } from "./notification-relay-fixture.mjs";

const { values } = parseArgs({
  options: {
    app: { type: "string", default: "http://127.0.0.1:5176" },
    debugger: { type: "string", default: "http://127.0.0.1:9225" },
    screenshot: { type: "string" },
  },
});
const until = Math.floor(Date.now() / 1000);
const events = createNotificationFixture(FIXTURE_USER, until - 2 * 86400, until, 40);
const relay = await startNotificationRelay(events, { latency: 5 });
const key = new Uint8Array(32).fill(1);
events.push(finalizeEvent({ kind: 10002, content: "", created_at: until, tags: [["r", relay.url]] }, key));
for (const [seed, name] of [
  [1, "Fixture User"],
  [2, "Fixture Author"],
]) {
  events.push(
    finalizeEvent(
      { kind: 0, content: JSON.stringify({ name }), created_at: until, tags: [] },
      new Uint8Array(32).fill(seed),
    ),
  );
}
const version = await fetch(`${values.debugger}/json/version`).then((response) => response.json());
const browser = await connect(version.webSocketDebuggerUrl);
const { browserContextId } = await browser.send("Target.createBrowserContext");
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", browserContextId });
const targets = await fetch(`${values.debugger}/json`).then((response) => response.json());
const target = targets.find((target) => target.id === targetId);
const cdp = await connect(target.webSocketDebuggerUrl);
const errors = [];
cdp.on("Runtime.exceptionThrown", (event) =>
  errors.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text),
);
cdp.on("Runtime.consoleAPICalled", (event) => {
  if (event.type === "error")
    errors.push(event.args.map((argument) => argument.value ?? argument.description).join(" "));
});
const results = [];
try {
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: values.app });
  await waitFor("document.readyState === 'complete'");
  await waitFor("!!window.notificationSync");
  await evaluate(`(async () => {
    const {default: settings} = await import('/src/services/preferences.ts');
    await settings.fallbackRelays.next(${JSON.stringify([relay.url])});
    await settings.eventCache.next('nostr-idb');
    const {default: accounts} = await import('/src/services/accounts.ts');
    await accounts.fromJSON([{id:${JSON.stringify(FIXTURE_USER)}, pubkey:${JSON.stringify(FIXTURE_USER)}, type:'readonly'}], true);
    window.__fixtureAccounts = accounts;
  })()`);
  for (const [route, domain, stream, expected] of [
    ["replies", "replies", "replyNotifications$", 40],
    ["mentions", "social", "mentionNotifications$", 41],
    ["quotes", "quotes", "quoteNotifications$", 1],
    ["threads", "conversations", "threadNotifications$", 1],
    ["reposts", "reposts", "repostNotifications$", 1],
    ["zaps", "zaps", "zapNotifications$", 1],
  ])
    results.push(await checkRoute(route, domain, stream, expected));
  await evaluate(`history.pushState({}, '', '/notifications'); dispatchEvent(new PopStateEvent('popstate'));`);
  await waitFor("document.body?.innerText.includes('Last 2 Days')");
  const overview = await evaluate(
    "({text:document.body?.innerText, scrollWidth:document.documentElement.scrollWidth, width:innerWidth})",
  );
  if (overview.scrollWidth > overview.width) throw new Error("Notification overview overflows horizontally");
  results.push({ route: "overview", passed: true });
  await checkRangeAndHistory();
  await checkLiveEvent();
  await checkCachedRestart();
  await checkPartialAndRetry();
  await checkMutesAndAccountChange();
  await checkMobile();
  if (values.screenshot) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    await writeFile(values.screenshot, Buffer.from(data, "base64"));
  }
  console.log(
    JSON.stringify(
      { environment: "isolated headless Chrome context, localhost fixture, readonly account", results, errors },
      null,
      2,
    ),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  cdp.close();
  await browser.send("Target.disposeBrowserContext", { browserContextId });
  browser.close();
  await relay.close();
}

async function checkRoute(route, domain, stream, expected) {
  console.error(`Checking ${route}`);
  await evaluate(
    "window.__fixtureSync?.unsubscribe(); window.__fixtureQuery?.unsubscribe(); window.__fixtureAccounts.clearActive();",
  );
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await evaluate(`(async () => {
    const {eventStore} = await import('/src/services/event-store.ts');
    for (const event of eventStore.getByFilters({})) eventStore.remove(event);
    await (await import('/src/services/event-cache/index.ts')).clearEvents();
    history.pushState({}, '', '/notifications/${route}'); dispatchEvent(new PopStateEvent('popstate'));
    window.__fixtureResults = []; window.__fixtureState = undefined;
    window.__fixtureAccounts.setActive(${JSON.stringify(FIXTURE_USER)});
    window.__fixtureSync = window.notificationSync[${JSON.stringify(domain)}].subscribe(state => { window.__fixtureState = state; });
    const notifications = await import('/src/services/notifications/index.ts');
    window.__fixtureQuery = notifications[${JSON.stringify(stream)}].subscribe(items => { window.__fixtureResults = items; });
  })()`);
  const started = performance.now();
  await waitFor(
    `window.__fixtureState?.done && window.__fixtureResults?.length === ${expected} && document.body?.innerText.includes('Load older') && document.body?.innerText.includes('Fixture Author') && [...document.querySelectorAll('button')].some(button => button.innerText === 'Load older' && !button.disabled)`,
  );
  const result =
    await evaluate(`({items:window.__fixtureResults.length, failedParents:window.__fixtureState.failedParents ?? 0,
    failedRelays:window.__fixtureState.failedRelays, liveError:window.__fixtureState.liveError?.message,
    width:innerWidth, scrollWidth:document.documentElement.scrollWidth, buttons:[...document.querySelectorAll('button')].filter(button=>button.innerText==='Load older').length})`);
  if (
    result.failedParents ||
    result.failedRelays.length ||
    result.liveError ||
    result.scrollWidth > result.width ||
    result.buttons !== 1
  ) {
    throw new Error(`${route} failed: ${JSON.stringify(result)}`);
  }
  return {
    route,
    mode: "direct route, empty store and persistent cache, reused shell",
    passed: true,
    elapsedMs: performance.now() - started,
    ...result,
  };
}

async function checkLiveEvent() {
  await evaluate(`history.pushState({}, '', '/notifications/mentions'); dispatchEvent(new PopStateEvent('popstate'));`);
  await waitFor("document.body?.innerText.includes('Load older')");
  const live = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["p", FIXTURE_USER]],
      content: `Live fixture nostr:${nip19.npubEncode(FIXTURE_USER)}`,
    },
    new Uint8Array(32).fill(2),
  );
  relay.publish(live);
  await waitFor(`document.body?.innerText.includes('Live fixture')`);
  results.push({ route: "mentions/live", passed: true });
}

async function checkCachedRestart() {
  console.error("Checking cached restart");
  await new Promise((resolve) => setTimeout(resolve, 1600));
  const previous = await evaluate("performance.timeOrigin");
  await cdp.send("Page.reload", { ignoreCache: true });
  await waitFor(
    `performance.timeOrigin !== ${previous} && document.body?.innerText.includes('Load older') && !document.body?.innerText.includes('Syncing notifications…')`,
  );
  await attachSocial();
  await waitFor("window.__fixtureState?.done && window.__fixtureResults?.length === 42");
  results.push({ route: "mentions/cached-restart", passed: true });
}

async function attachSocial(domain = "social") {
  await evaluate(`(async () => {
    window.__fixtureSync?.unsubscribe(); window.__fixtureQuery?.unsubscribe();
    window.__fixtureAccounts = (await import('/src/services/accounts.ts')).default;
    window.__fixtureSync = window.notificationSync[${JSON.stringify(domain)}].subscribe(state => { window.__fixtureState = state; });
    const {mentionNotifications$} = await import('/src/services/notifications/index.ts');
    window.__fixtureQuery = mentionNotifications$.subscribe(items => { window.__fixtureResults = items; });
  })()`);
}

async function checkRangeAndHistory() {
  console.error("Checking overview range and older history");
  await attachSocial("conversations");
  await evaluate(
    "const select = document.querySelector('select'); select.value = 'lastWeek'; select.dispatchEvent(new Event('change', {bubbles:true}));",
  );
  await waitFor("window.__fixtureState?.done && window.__fixtureState.since < Date.now()/1000 - 6*86400");
  await evaluate("history.pushState({}, '', '/notifications/mentions'); dispatchEvent(new PopStateEvent('popstate'));");
  await waitFor("document.body?.innerText.includes('Load older')");
  const previous = await evaluate("window.__fixtureState.since");
  await evaluate("[...document.querySelectorAll('button')].find(button=>button.innerText==='Load older').click()");
  await waitFor(`window.__fixtureState?.done && window.__fixtureState.since < ${previous}`);
  results.push({ route: "overview/range-and-older-history", passed: true });
}

async function checkPartialAndRetry() {
  console.error("Checking partial relay failure and retry");
  const bad = finalizeEvent(
    {
      kind: 10002,
      content: "",
      created_at: until + 20,
      tags: [
        ["r", relay.url],
        ["r", "ws://127.0.0.1:1/"],
      ],
    },
    key,
  );
  await evaluate(
    `(async () => { (await import('/src/services/event-store.ts')).eventStore.add(${JSON.stringify(bad)}); })()`,
  );
  await waitFor(
    "window.__fixtureState?.done && window.__fixtureState.failedRelays.length > 0 && document.body?.innerText.includes('Retry')",
  );
  const good = finalizeEvent({ kind: 10002, content: "", created_at: until + 21, tags: [["r", relay.url]] }, key);
  await evaluate(`(async () => {
    [...document.querySelectorAll('button')].find(button=>button.innerText==='Retry').click();
    (await import('/src/services/event-store.ts')).eventStore.add(${JSON.stringify(good)});
  })()`);
  await waitFor(
    "window.__fixtureState?.done && window.__fixtureState.failedRelays.length === 0 && !document.body?.innerText.includes('Some notifications could not be loaded')",
  );
  results.push({ route: "mentions/partial-and-retry", passed: true });
}

async function checkMutesAndAccountChange() {
  console.error("Checking mute updates and account isolation");
  const muted = finalizeEvent(
    { kind: 10000, content: "", created_at: until + 30, tags: [["p", getPublicKey(new Uint8Array(32).fill(2))]] },
    key,
  );
  const unmuted = finalizeEvent({ kind: 10000, content: "", created_at: until + 31, tags: [] }, key);
  await evaluate(
    `(async () => { (await import('/src/services/event-store.ts')).eventStore.add(${JSON.stringify(muted)}); })()`,
  );
  await waitFor(
    "window.__fixtureResults?.length === 0 && document.body?.innerText.includes('No notifications in this period')",
  );
  await evaluate(
    `(async () => { (await import('/src/services/event-store.ts')).eventStore.add(${JSON.stringify(unmuted)}); })()`,
  );
  await waitFor("window.__fixtureResults?.length === 42");
  await evaluate("window.__fixtureAccounts.clearActive()");
  await waitFor("window.__fixtureState === undefined && document.body?.innerText.includes('You must be signed in')");
  const other = getPublicKey(new Uint8Array(32).fill(3));
  await evaluate(
    `window.__fixtureAccounts.fromJSON([{id:${JSON.stringify(FIXTURE_USER)},pubkey:${JSON.stringify(FIXTURE_USER)},type:'readonly'}, {id:${JSON.stringify(other)},pubkey:${JSON.stringify(other)},type:'readonly'}], true); window.__fixtureAccounts.setActive(${JSON.stringify(other)});`,
  );
  await waitFor(
    "window.__fixtureState?.done && window.__fixtureResults?.length === 0 && document.body?.innerText.includes('No notifications in this period')",
  );
  await evaluate(`window.__fixtureAccounts.setActive(${JSON.stringify(FIXTURE_USER)});`);
  await waitFor("window.__fixtureState?.done && window.__fixtureResults?.length === 42");
  results.push({ route: "mentions/mute-and-account-isolation", passed: true });
}

async function checkMobile() {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await waitFor(
    "innerWidth === 390 && [...document.querySelectorAll('button')].some(button => button.innerText === 'Load older' && !button.disabled)",
  );
  const width = await evaluate("({width:innerWidth, scrollWidth:document.documentElement.scrollWidth})");
  if (width.scrollWidth > width.width) throw new Error("Mobile notifications overflow horizontally");
  results.push({ route: "mentions/mobile", passed: true, ...width });
}

async function evaluate(expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(expression) {
  const started = performance.now();
  while (performance.now() - started < 20000) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      if (!/context|navigation/i.test(error.message)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const diagnostic = await evaluate(
    "({text: document.body?.innerText.slice(-3000), state: window.__fixtureState, items: window.__fixtureResults?.length})",
  );
  throw new Error(`Timed out: ${expression}\n${JSON.stringify({ diagnostic, errors })}`);
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message));
      else request?.resolve(message.result);
    } else listeners.get(message.method)?.(message.params);
  });
  socket.addEventListener("close", () => {
    for (const request of pending.values()) request.reject(new Error("Debugger connection closed"));
    pending.clear();
  });
  return {
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Debugger command timed out: ${method}`)), 15000);
        pending.set(++id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
        socket.send(JSON.stringify({ id, method, params }));
      }),
    on: (method, listener) => listeners.set(method, listener),
    close: () => socket.close(),
  };
}
