import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Spinner, Text } from "@chakra-ui/react";
import { Page } from "../../components/page";
import { useParams } from "react-router-dom";
import { normalizeToHex } from "../../helpers/nip-19";
import { Note } from "../../components/note";
import { useThreadLoader } from "../../hooks/use-thread-loader";
import { ThreadPost } from "./thread-post";

export const EventPage = () => {
  const params = useParams();
  let id = normalizeToHex(params.id ?? "");

  if (!id) {
    return (
      <Page>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Invalid event id</AlertTitle>
          <AlertDescription>"{params.id}" dose not look like a valid event id</AlertDescription>
        </Alert>
      </Page>
    );
  }

  return (
    <Page>
      <EventView eventId={id} />
    </Page>
  );
};

export type EventViewProps = {
  eventId: string;
};

export const EventView = ({ eventId }: EventViewProps) => {
  const id = normalizeToHex(eventId) ?? "";
  const { thread, events, rootId, focusId, loading } = useThreadLoader(id, { enabled: !!id });

  if (loading) return <Spinner />;

  let pageContent = <span>Missing Event</span>;

  const isRoot = rootId === focusId;
  const rootPost = thread.get(rootId);
  if (isRoot && rootPost) {
    pageContent = <ThreadPost post={rootPost} initShowReplies />;
  }

  const post = thread.get(focusId);
  if (post) {
    const parentPosts = [];
    if (post.reply) {
      let p = post;
      while (p.reply) {
        parentPosts.unshift(p.reply);
        p = p.reply;
      }
    }

    pageContent = (
      <>
        {parentPosts.map((parent) => (
          <Note key={parent.event.id + "-rely"} event={parent.event} />
        ))}
        <ThreadPost key={post.event.id} post={post} initShowReplies />
      </>
    );
  } else if (events[focusId]) {
    pageContent = <Note event={events[focusId]} />;
  }

  return (
    <Flex direction="column" gap="4" overflow="auto" flex={1} pb="4" pt="4" pl="1" pr="1">
      {pageContent}
    </Flex>
  );
};
