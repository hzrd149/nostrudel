import { logger } from "../../helpers/debug";
import type { NappletPermission } from "./permission-types";
import {
  getPermissionDecision,
  hasApprovedCapability,
  permissionChanges$,
  setPermissionDecision,
  type NappletIdentity,
} from "./permissions";

const log = logger.extend("napplet-permission-controller");

export type PermissionAnswer = "deny" | "reject" | "session" | "remember";
export type PermissionPrompt = {
  windowId: string;
  identity: NappletIdentity;
  permission: NappletPermission;
  signal: AbortSignal;
};

/** Consent belongs to a mounted, source-verified frame; manifests never authorize operations. */
export function createPermissionController(options: {
  identity(windowId: string): NappletIdentity | undefined;
  ask(prompt: PermissionPrompt): Promise<PermissionAnswer>;
  grant(identity: NappletIdentity, permission: NappletPermission): void;
}) {
  const frames = new Map<string, AbortController>();
  const pending = new Map<string, Promise<boolean>>();
  const revisions = new Map<string, number>();
  const changes = permissionChanges$.subscribe((change) => {
    if (change.identity && change.permission && getPermissionDecision(change.identity, change.permission) === "allow")
      return;
    for (const windowId of frames.keys()) {
      const identity = options.identity(windowId);
      if (
        !change.identity ||
        (identity &&
          identity.pubkey === change.identity.pubkey &&
          identity.dTag === change.identity.dTag &&
          identity.aggregateHash === change.identity.aggregateHash)
      ) {
        revisions.set(windowId, (revisions.get(windowId) ?? 0) + 1);
        frames.get(windowId)?.abort();
        frames.set(windowId, new AbortController());
      }
    }
  });
  return {
    register(windowId: string) {
      frames.get(windowId)?.abort();
      frames.set(windowId, new AbortController());
    },
    destroyWindow(windowId: string) {
      frames.get(windowId)?.abort();
      frames.delete(windowId);
      revisions.delete(windowId);
    },
    async authorize(windowId: string, permission: NappletPermission, signal?: AbortSignal): Promise<boolean> {
      const identity = options.identity(windowId);
      const lifetime = frames.get(windowId)?.signal;
      if (!identity || !lifetime || lifetime.aborted || signal?.aborted) return false;
      const decision = getPermissionDecision(identity, permission);
      if (decision === "block") return false;
      if (decision === "allow" || hasApprovedCapability(identity, permission)) {
        if (!hasApprovedCapability(identity, permission)) options.grant(identity, permission);
        return true;
      }
      const key = `${windowId}:${permission}`;
      let request = pending.get(key);
      if (!request) {
        if (pending.size >= 16) return false;
        const revision = revisions.get(windowId) ?? 0;
        const requestSignal = signal ? AbortSignal.any([lifetime, signal]) : lifetime;
        request = (async () => {
          const answer = await new Promise<PermissionAnswer>((resolve, reject) => {
            const abort = () => resolve("deny");
            requestSignal.addEventListener("abort", abort, { once: true });
            void Promise.resolve()
              .then(() => options.ask({ windowId, identity, permission, signal: requestSignal }))
              .then(
                (answer) => {
                  requestSignal.removeEventListener("abort", abort);
                  resolve(answer);
                },
                (error) => {
                  requestSignal.removeEventListener("abort", abort);
                  reject(error);
                },
              );
          });
          if (
            requestSignal.aborted ||
            options.identity(windowId) !== identity ||
            (revisions.get(windowId) ?? 0) !== revision ||
            answer === "deny"
          )
            return false;
          if (answer === "reject") {
            setPermissionDecision(identity, permission, "block");
            return false;
          }
          if (answer === "remember") setPermissionDecision(identity, permission, "allow");
          options.grant(identity, permission);
          return true;
        })().finally(() => {
          if (pending.get(key) === request) pending.delete(key);
        });
        pending.set(key, request);
      }
      if (!signal) return request;
      return new Promise<boolean>((resolve) => {
        const abort = () => resolve(false);
        signal.addEventListener("abort", abort, { once: true });
        void request!.then(
          (allowed) => {
            signal.removeEventListener("abort", abort);
            resolve(!signal.aborted && allowed);
          },
          (error) => {
            signal.removeEventListener("abort", abort);
            log("Permission request failed", error);
            resolve(false);
          },
        );
      });
    },
    dispose() {
      changes.unsubscribe();
      for (const frame of frames.values()) frame.abort();
      frames.clear();
    },
  };
}
