import { Flex, Spinner } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useParams } from "react-router-dom";
import { Note } from "../../components/note";
import { isHexKey } from "../../helpers/nip19";
import { useThreadLoader } from "../../hooks/use-thread-loader";
import { ThreadPost } from "./components/thread-post";

function useNotePointer() {
  const { id } = useParams() as { id: string };
  if (isHexKey(id)) return { id, relays: [] };
  const pointer = nip19.decode(id);

  switch (pointer.type) {
    case "note":
      return { id: pointer.data as string, relays: [] };
    case "nevent":
      return { id: pointer.data.id, relays: pointer.data.relays ?? [] };
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

export default function NoteView() {
  const pointer = useNotePointer();

  const { thread, events, rootId, focusId, loading } = useThreadLoader(pointer.id, pointer.relays, {
    enabled: !!pointer.id,
  });
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
          <Note key={parent.event.id + "-rely"} event={parent.event} />
        ))}
        <ThreadPost key={post.event.id} post={post} initShowReplies focusId={focusId} />
      </>
    );
  } else if (events[focusId]) {
    pageContent = <Note event={events[focusId]} variant="filled" />;
  }

  return (
    <Flex direction="column" gap="4" flex={1} pb="12" pt="4" pl="1" pr="1">
      {pageContent}
    </Flex>
  );
}
