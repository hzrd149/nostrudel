import { filter, finalize, fromEvent, map, Observable, takeUntil, takeWhile, tap } from "rxjs";
import { nanoid } from "nanoid";
import type { RPCCommandDirectory, RPCMessage, RPCResponse } from "./interface";
import { logger } from "../../helpers/debug";

const log = logger.extend("RPCClient");

/** A client for calling remote methods */
export class RPCClient<Commands extends RPCCommandDirectory = {}> {
  incoming: Observable<RPCResponse>;
  outgoing: (message: RPCMessage) => void;

  constructor(incoming: Observable<RPCResponse>, outgoing: (message: RPCMessage) => void) {
    this.incoming = incoming;
    this.outgoing = outgoing;
  }

  /** Call a remote method */
  call<C extends keyof Commands>(command: C, payload: Commands[C]["payload"]): Observable<Commands[C]["result"]> {
    return new Observable((observer) => {
      const id = nanoid(8);
      const callLog = log.extend(id);

      callLog("Calling", command, payload);
      this.outgoing({ type: "CALL", id, command: String(command), payload });

      // Return an observable that listens for the results
      return this.incoming
        .pipe(
          filter((r) => r.id === id),
          tap((r) => callLog("Received", r)),
          takeWhile((r) => r.type !== "COMPLETE"),
          map((r) => {
            if (r.type === "ERROR") throw new Error(r.error);
            return r.value;
          }),
          takeUntil(fromEvent(window, "beforeunload")),
          finalize(() => {
            callLog("Closing");
            this.outgoing({ type: "CLOSE", id });
          }),
        )
        .subscribe(observer);
    });
  }
}
