import React, { useEffect, useState } from "react";
import { SkeletonText } from "@chakra-ui/react";
import settingsService from "../../services/settings";
import { useSubscription } from "../../hooks/use-subscription";
import { Post } from "../../components/post";

const relayUrls = await settingsService.getRelays();

export const UserPostsTab = ({ pubkey }) => {
  const [events, setEvents] = useState({});

  const sub = useSubscription(
    relayUrls,
    { authors: [pubkey], kinds: [1] },
    `${pubkey} posts`
  );

  useEffect(() => {
    const s = sub.onEvent.subscribe((event) => {
      setEvents((dir) => {
        if (!dir[event.id]) {
          return { [event.id]: event, ...dir };
        }
        return dir;
      });
    });

    return () => s.unsubscribe();
  }, [sub]);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return timeline.map((event) => <Post key={event.id} event={event} />);
};
