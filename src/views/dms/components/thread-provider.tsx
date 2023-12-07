import { PropsWithChildren, createContext, useContext } from "react";

import TimelineLoader from "../../../classes/timeline-loader";
import { NostrEvent } from "../../../types/nostr-event";
import useSubject from "../../../hooks/use-subject";

export type Thread = {
  root?: NostrEvent;
  rootId: string;
  messages: NostrEvent[];
};
type ThreadsContextType = {
  threads: Record<string, Thread>;
};
const ThreadsContext = createContext<ThreadsContextType>({ threads: {} });

export function useThreadsContext() {
  return useContext(ThreadsContext);
}

export default function ThreadsProvider({ timeline, children }: { timeline: TimelineLoader } & PropsWithChildren) {
  const messages = useSubject(timeline.timeline);

  const groupedByRoot: Record<string, NostrEvent[]> = {};
  for (const message of messages) {
    const rootId = message.tags.find((t) => t[0] === "e" && t[3] === "root")?.[1];
    if (rootId) {
      if (!groupedByRoot[rootId]) groupedByRoot[rootId] = [];
      groupedByRoot[rootId].push(message);
    }
  }

  const threads: Record<string, Thread> = {};
  for (const [rootId, messages] of Object.entries(groupedByRoot)) {
    threads[rootId] = {
      messages,
      rootId,
      root: timeline.events.getEvent(rootId),
    };
  }

  return <ThreadsContext.Provider value={{ threads }}>{children}</ThreadsContext.Provider>;
}
