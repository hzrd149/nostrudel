import { RelayGroupError } from "applesauce-relay";
import { concat, defaultIfEmpty, finalize, firstValueFrom, of, Subject, switchMap, throwError, toArray } from "rxjs";
import { describe, expect, it, vi } from "vitest";

const { log } = vi.hoisted(() => ({ log: vi.fn() }));
vi.mock("./debug", () => ({ logger: { extend: () => log } }));

import ignoreRelayErrors from "./ignore-relay-errors";

const failure = new RelayGroupError([["wss://offline.example", new Error("Connection failed")]]);

describe("best-effort relay reads", () => {
  it("logs aggregate failures and completes so empty-result loading states settle", async () => {
    const result = await firstValueFrom(
      throwError(() => failure).pipe(ignoreRelayErrors("History"), defaultIfEmpty([])),
    );
    expect(result).toEqual([]);
    expect(log).toHaveBeenCalledWith("History", failure);
  });

  it("preserves events received before every relay fails", async () => {
    const result = await firstValueFrom(
      concat(
        of("cached", "remote"),
        throwError(() => failure),
      ).pipe(ignoreRelayErrors("Replies"), toArray()),
    );
    expect(result).toEqual(["cached", "remote"]);
  });

  it("keeps account/relay changes alive after a failed inner read", () => {
    const inputs = new Subject<boolean>();
    const next = vi.fn();
    const error = vi.fn();
    const sub = inputs
      .pipe(
        switchMap((offline) =>
          (offline ? throwError(() => failure) : of("recovered")).pipe(ignoreRelayErrors("Messages")),
        ),
      )
      .subscribe({ next, error });
    inputs.next(true);
    expect(sub.closed).toBe(false);
    inputs.next(false);
    expect(next).toHaveBeenCalledWith("recovered");
    expect(error).not.toHaveBeenCalled();
    sub.unsubscribe();
  });

  it("still tears down live subscriptions on unmount", () => {
    const cleanup = vi.fn();
    const source = new Subject<string>();
    const sub = source.pipe(finalize(cleanup), ignoreRelayErrors("Live")).subscribe();
    sub.unsubscribe();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
