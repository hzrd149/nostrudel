import { defer, filter, fromEvent, map, NEVER, share, shareReplay } from "rxjs";
import type { ClientWorkerCommands } from "../common/interface";
import { RPCClient } from "../common/rpc-client";

// Create an rpc client for calling the worker
export const serviceWorkerRPC =
  "serviceWorker" in navigator
    ? new RPCClient<ClientWorkerCommands>(
        // Listen for messages from the worker
        fromEvent<MessageEvent>(navigator.serviceWorker, "message").pipe(
          // Select the data
          map((event) => event.data),
          // Ensure its an RPC message
          filter((message) => Reflect.has(message, "type")),
          // Only subscribe to events once
          share(),
        ),
        // Send message to the worker
        (message) => navigator.serviceWorker?.controller?.postMessage(message),
      )
    : undefined;

// Define RxJS observables that can be subscribed to to get data from the service worker
export const errors$ = defer(() => (serviceWorkerRPC ? serviceWorkerRPC.call("errors.getAll", void 0) : NEVER)).pipe(
  shareReplay(1),
);
