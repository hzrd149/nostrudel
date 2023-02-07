import { useEffect, useMemo, useRef } from "react";
import { useUnmount } from "react-use";
import { ThreadLoader } from "../classes/thread-loader";
import { linkEvents } from "../helpers/thread";
import settings from "../services/settings";
import useSubject from "./use-subject";

type Options = {
  enabled?: boolean;
};

export function useThreadLoader(eventId: string, opts?: Options) {
  const relays = useSubject(settings.relays);

  const ref = useRef<ThreadLoader | null>(null);
  const loader = (ref.current = ref.current || new ThreadLoader(relays, eventId));

  useEffect(() => {
    if (eventId !== loader.focusId.value) loader.updateEventId(eventId);
  }, [eventId]);

  const enabled = opts?.enabled ?? true;
  useEffect(() => {
    if (enabled) loader.open();
    else loader.close();
  }, [enabled]);

  useUnmount(() => {
    loader.close();
  });

  const events = useSubject(loader.events);
  const loading = useSubject(loader.loading);
  const rootId = useSubject(loader.rootId);
  const focusId = useSubject(loader.focusId);
  const linked = useMemo(() => linkEvents(Object.values(events)), [events]);

  return {
    loader,
    events,
    linked,
    rootId,
    focusId,
    loading,
  };
}
