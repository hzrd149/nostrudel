import { Flex, Spinner } from "@chakra-ui/react";
import { useLoaderData } from "react-router-dom";
import { Note } from "../../components/note";
import { useThreadLoader } from "../../hooks/use-thread-loader";
import { ThreadPost } from "./thread-post";

const NoteView = () => {
  const { id } = useLoaderData() as { id: string };

  const { thread, events, rootId, focusId, loading } = useThreadLoader(id, { enabled: !!id });
  if (loading) return <Spinner />;

  let pageContent = <span>Missing Event</span>;

  const isRoot = rootId === focusId;
  const rootPost = thread.get(rootId);
  if (isRoot && rootPost) {
    pageContent = <ThreadPost post={rootPost} initShowReplies focusId={focusId} />;
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
          <Note key={parent.event.id + "-rely"} event={parent.event} maxHeight={200} />
        ))}
        <ThreadPost key={post.event.id} post={post} initShowReplies focusId={focusId} />
      </>
    );
  } else if (events[focusId]) {
    pageContent = <Note event={events[focusId]} variant="filled" />;
  }

  return (
    <Flex direction="column" gap="4" overflow="auto" flex={1} pb="4" pt="4" pl="1" pr="1">
      {pageContent}
    </Flex>
  );
};

export default NoteView;
