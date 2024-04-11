import { WorkerRelayInterface } from "@snort/worker-relay";
import WorkerVite from "@snort/worker-relay/src/worker?worker";

const workerScript = import.meta.env.DEV
  ? new URL("@snort/worker-relay/dist/esm/worker.mjs", import.meta.url)
  : new WorkerVite();

const workerRelay = new WorkerRelayInterface(workerScript);
await workerRelay.init("nostrudel.db");

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.workerRelay = workerRelay;
}

export default workerRelay;
