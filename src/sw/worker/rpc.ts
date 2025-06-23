import { filter, fromEvent, merge, share, Subject, takeUntil } from "rxjs";
import type { ClientWorkerCommands, RPCMessage, RPCResponseComplete } from "../common/interface";
import { RPCServer } from "../common/rpc-server";

export const rpcServer = new RPCServer<ClientWorkerCommands>();

// Create a stream of incoming messages
const messages = fromEvent<MessageEvent>(self, "message").pipe(
  filter((event) => Reflect.has(event.data, "type")),
  share(),
);

// Listen for incoming CALL messages
messages.subscribe((message) => {
  const data = message.data as RPCMessage;

  if (Reflect.has(data, "type") && data.type === "CALL") {
    // Create a subject to signal client disconnection
    const clientDisconnect$ = new Subject<void>();

    rpcServer
      .call(data.id, data.command, data.payload)
      .pipe(
        // Close the request when either:
        // 1. A close message is received, OR
        // 2. The client disconnects (postMessage fails)
        takeUntil(
          merge(messages.pipe(filter((e) => e.data.id === data.id && e.data.type === "CLOSE")), clientDisconnect$),
        ),
      )
      .subscribe({
        next: (response) => {
          try {
            message.source?.postMessage(response);
          } catch (error) {
            console.warn("[RPC] Client disconnected, closing subscription:", error);
            clientDisconnect$.next();
            clientDisconnect$.complete();
          }
        },
        // Send the complete message when the request is complete
        complete: () => {
          try {
            message.source?.postMessage({
              id: data.id,
              type: "COMPLETE",
            } satisfies RPCResponseComplete);
          } catch (error) {
            console.warn("[RPC] Failed to send complete message, client likely disconnected:", error);
          }
        },
      });
  }
});
