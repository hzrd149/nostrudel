import { useEffect, useMemo, useState } from "react";
import type { UseFormReset } from "react-hook-form";
import useAsyncAction from "./use-async-action";
import useMessaging from "./use-messaging";

/** React form adapter; ordering and persistence of draft revisions belong to the SDK conversation. */
export default function useMessageDraft(
  protocol: "nip04" | "nip17",
  recipients: string[],
  content: string,
  dirty: boolean,
  reset: UseFormReset<{ content: string }>,
) {
  const session = useMessaging();
  const key = [...new Set(recipients)].sort().join(",");
  const conversation = useMemo(
    () => (protocol === "nip04" ? session?.legacy.conversation(key) : session?.wrapped.conversation(key.split(","))),
    [session, protocol, key],
  );
  const [loaded, setLoaded] = useState<typeof conversation>();
  const load = useAsyncAction(
    async (signal: AbortSignal) => {
      if (!conversation) return;
      const draft = await conversation.loadDraft();
      if (signal.aborted) return;
      reset({ content: draft?.content ?? "" });
      setLoaded(conversation);
    },
    [conversation, reset],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load.run(controller.signal);
    return () => controller.abort();
  }, [load.run]);
  const save = useAsyncAction(
    async (value: string) => {
      await conversation?.setDraft({ content: value });
    },
    [conversation],
  );
  const ready = !!conversation && loaded === conversation;
  useEffect(() => {
    if (ready && dirty) void save.run(content);
  }, [ready, dirty, content, save.run]);
  const clear = useAsyncAction(async () => {
    await conversation?.clearDraft();
  }, [conversation]);
  return { ready, clear: clear.run };
}
