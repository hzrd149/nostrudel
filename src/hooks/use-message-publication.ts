import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import type { MessageContent } from "../services/messaging/publication";
import useAsyncAction from "./use-async-action";
import useMessaging from "./use-messaging";

export default function useMessagePublication(protocol: "nip04" | "nip17", recipients: string[]) {
  const session = useMessaging();
  const key = [...new Set(recipients)].sort().join(",");
  const publication = useMemo(() => session?.publication(protocol, key.split(",")), [session, protocol, key]);
  const pending = use$(() => publication?.pending$, [publication]);
  const busy = use$(() => publication?.busy$, [publication]);
  const send = useAsyncAction(
    async (request: MessageContent) => {
      if (!publication) throw new Error("Messaging is not ready");
      await publication.send(request);
      return true;
    },
    [publication],
  );
  return { pending, busy: busy || send.loading, ready: !!publication, send: send.run };
}
