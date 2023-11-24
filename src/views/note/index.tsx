import { Button, Spinner } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useParams, Link as RouterLink } from "react-router-dom";

import Note from "../../components/note";
import { getSharableEventAddress, isHexKey } from "../../helpers/nip19";
import { useThreadLoader } from "../../hooks/use-thread-loader";
import { ThreadPost } from "./components/thread-post";
import VerticalPageLayout from "../../components/vertical-page-layout";

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
        {parentPosts.length > 1 && (
          <Button
            variant="outline"
            size="lg"
            h="4rem"
            w="full"
            as={RouterLink}
            to={`/n/${getSharableEventAddress(parentPosts[0].event)}`}
          >
            View full thread ({parentPosts.length - 1})
          </Button>
        )}
        {post.reply && (
          <Note key={post.reply.event.id + "-rely"} event={post.reply.event} hideDrawerButton showReplyLine={false} />
        )}
        <ThreadPost key={post.event.id} post={post} initShowReplies focusId={focusId} />
      </>
    );
  } else if (events[focusId]) {
    pageContent = <Note event={events[focusId]} variant="filled" hideDrawerButton />;
  }

  return <VerticalPageLayout px={{ base: 0, md: "2" }}>{pageContent}</VerticalPageLayout>;
}
