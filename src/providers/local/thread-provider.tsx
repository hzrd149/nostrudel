import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { NostrEvent } from "nostr-tools";

import TimelineLoader from "../../classes/timeline-loader";
import useSubject from "../../hooks/use-subject";

export type Thread = {
  root?: NostrEvent;
  rootId: string;
  messages: NostrEvent[];
};
type ThreadsContextType = {
  threads: Record<string, Thread>;
  getRoot: (id: string) => NostrEvent | undefined;
};
const ThreadsContext = createContext<ThreadsContextType>({
  threads: {},
  getRoot: (id: string) => {
    return undefined;
  },
});

export function useThreadsContext() {
  return useContext(ThreadsContext);
}

export default function ThreadsProvider({ timeline, children }: { timeline: TimelineLoader } & PropsWithChildren) {
  const messages = useSubject(timeline.timeline);

  const threads = useMemo(() => {
    const grouped: Record<string, Thread> = {};
    for (const message of messages) {
      const rootId = message.tags.find((t) => t[0] === "e" && t[3] === "root")?.[1];
      if (rootId) {
        if (!grouped[rootId]) {
          grouped[rootId] = {
            messages: [],
            rootId,
            root: timeline.events.getEvent(rootId),
          };
        }
        grouped[rootId].messages.push(message);
      }
    }
    return grouped;
  }, [messages.length, timeline.events]);

  const getRoot = useCallback(
    (id: string) => {
      return timeline.events.getEvent(id);
    },
    [timeline.events],
  );

  const context = useMemo(() => ({ threads, getRoot }), [threads, getRoot]);

  return <ThreadsContext.Provider value={context}>{children}</ThreadsContext.Provider>;
}
