import { use$ } from "applesauce-react/hooks";
import { useEffect, useRef } from "react";
import useAsyncAction from "./use-async-action";
import useMessaging from "./use-messaging";

/** Controls the client's shared receiver, including explicit retry after signer rejection. */
export default function useGiftWrapDecryption() {
  const session = useMessaging();
  const client = session?.wrapped;
  const locked = use$(() => session?.locked$, [session]);
  const state = use$(() => client?.decryptionState$, [client]);
  const running = use$(() => client?.receiver.autoUnlock$, [client]);
  const retryController = useRef<AbortController>();
  useEffect(() => () => retryController.current?.abort(), [client]);
  const retry = useAsyncAction(async () => {
    if (!client) return;
    retryController.current?.abort();
    const controller = new AbortController();
    retryController.current = controller;
    for await (const result of client.receiver.retryFailed({ signal: controller.signal })) {
      if (result.status === "failed" && result.failure.code === "signer-rejected") throw result.failure.cause;
    }
  }, [client]);

  return {
    locked,
    failed: state?.failed,
    running: running || retry.loading,
    decrypted: state?.unlocked ?? 0,
    start: () => client?.setAutoUnlock(true),
    stop: () => {
      retryController.current?.abort();
      client?.setAutoUnlock(false);
    },
    retryFailed: retry.run,
  };
}
