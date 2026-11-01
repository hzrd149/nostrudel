import type { ServiceHandler } from "@kehto/runtime";
import { createCvmService } from "./cvm-session";
import { createCvmRelayTransport, type CvmRelayTransport } from "./cvm-relay-transport";
import { getNappletTransportSigner, type NappletTransportSigner } from "./transport-identity";

export type NappletCvmOptions = {
  resolveIdentity(windowId: string): string | undefined;
  requestConsent(windowId: string, signal: AbortSignal): Promise<boolean>;
  createTransport?: (signer: NappletTransportSigner) => CvmRelayTransport;
};

/** Each mounted frame owns its sessions and its independent CVM permission flag. */
export function createNappletCvmService(options: NappletCvmOptions): ServiceHandler {
  const frames = new Map<string, ReturnType<typeof createCvmService>>();
  return {
    descriptor: { name: "cvm", version: "1.0.0" },
    handleMessage(windowId, message, send) {
      const identity = options.resolveIdentity(windowId);
      if (!identity) return;
      let frame = frames.get(windowId);
      if (!frame) {
        const signer = getNappletTransportSigner(identity);
        let approved = false;
        frame = createCvmService(
          async (signal) => {
            if (!approved) {
              const allowed = await options.requestConsent(windowId, signal);
              if (!allowed || signal.aborted || options.resolveIdentity(windowId) !== identity)
                throw new Error("policy denied");
              approved = true;
            }
            return identity;
          },
          signer,
          (options.createTransport ?? createCvmRelayTransport)(signer),
        );
        frames.set(windowId, frame);
      }
      frame.handleMessage(windowId, message, send);
    },
    onWindowDestroyed(windowId) {
      frames.get(windowId)?.dispose();
      frames.delete(windowId);
    },
  };
}
