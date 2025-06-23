import {
  catchError,
  filter,
  from,
  isObservable,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  takeUntil,
  tap,
  type OperatorFunction,
} from "rxjs";
import type {
  RPCCommandDirectory,
  RPCHandlerRegistry,
  RPCMessage,
  RPCResponse,
  RPCResponseError,
  RPCResponseResult,
} from "./interface";
import { logger } from "../../helpers/debug";

const log = logger.extend("RPCServer");

export class RPCServer<Commands extends RPCCommandDirectory = {}> {
  private handlers: RPCHandlerRegistry<Commands> = {} as RPCHandlerRegistry<Commands>;

  /** Register a handler for a specific command */
  register<T extends keyof RPCHandlerRegistry<Commands>>(command: T, handler: RPCHandlerRegistry<Commands>[T]): void {
    this.handlers[command] = handler;
    log(`Registered handler for command: ${String(command)}`);
  }

  /** Unregister a handler for a specific command */
  unregister<T extends keyof RPCHandlerRegistry<Commands>>(command: T): void {
    delete this.handlers[command];
    log(`Unregistered handler for command: ${String(command)}`);
  }

  // Listen on an incoming port and return a stream of all outgoing messages
  connect(incoming: Observable<RPCMessage>): Observable<RPCResponse> {
    return incoming.pipe(
      filter((m) => m.type === "CALL"),
      mergeMap((message) =>
        this.call(message.id, message.command, message.payload).pipe(
          // Close the connection when the incoming stream receives a close message
          takeUntil(incoming.pipe(filter((m) => m.id === message.id && m.type === "CLOSE"))),
        ),
      ),
    );
  }

  /** Call a command on the server */
  call<C extends keyof Commands>(
    id: string,
    command: C,
    payload: Commands[C]["payload"],
  ): Observable<RPCResponse<Commands[C]["result"]>> {
    const handler = this.handlers[command];
    if (!handler) throw new Error(`No handler registered for command: ${String(command)}`);

    let result = handler(payload);
    if (result instanceof Promise)
      return from(result).pipe(
        switchMap((r) => (isObservable(r) ? r : of(r))),
        RPCServer.convertToResponse(id),
      );
    else if (isObservable(result)) return result.pipe(RPCServer.convertToResponse(id));
    else return of(result).pipe(RPCServer.convertToResponse(id));
  }

  // And operator that converts an observable to a response object
  static convertToResponse<T = any>(id: string): OperatorFunction<T, RPCResponse> {
    return (source) =>
      source.pipe(
        // Make to response object
        map((value) => ({ type: "RESULT", id, value }) satisfies RPCResponseResult),
        tap((response) => log(`Response:`, response)),
        // Catche errors
        catchError((error) => {
          log("Error", error);
          return of({
            type: "ERROR",
            id,
            error: error instanceof Error ? error.message : "Unknown error",
          } satisfies RPCResponseError);
        }),
      );
  }

  /**
   * Get list of registered commands
   */
  getRegisteredCommands(): string[] {
    return Object.keys(this.handlers);
  }

  /**
   * Check if a command is registered
   */
  hasCommand(command: string): boolean {
    return command in this.handlers;
  }
}
