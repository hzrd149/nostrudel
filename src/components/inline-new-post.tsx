import { Button, useDisclosure } from "@chakra-ui/react";
import moment from "moment";
import { useState } from "react";
import { lastValueFrom } from "rxjs";
import { nostrPostAction } from "../classes/nostr-post-action";
import settings from "../services/settings";
import { DraftNostrEvent } from "../types/nostr-event";
import { AddIcon } from "./icons";
import { PostForm, PostFormValues } from "./post-modal/post-form";

export type InlineNewPostProps = {};

export const InlineNewPost = ({}: InlineNewPostProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [loading, setLoading] = useState(false);

  const handlePostSubmit = async (values: PostFormValues) => {
    setLoading(true);
    const draft: DraftNostrEvent = {
      content: values.content,
      tags: [],
      kind: 1,
      created_at: moment().unix(),
    };

    if (window.nostr) {
      const event = await window.nostr.signEvent(draft);

      const postResults = nostrPostAction(settings.relays.value, event);

      postResults.subscribe((result) => {
        console.log(`Posted event to ${result.url}: ${result.message}`);
      });

      await lastValueFrom(postResults);
    }
    setLoading(false);
  };

  if (isOpen) {
    return <PostForm onSubmit={handlePostSubmit} onCancel={onClose} loading={loading} />;
  }
  return (
    <Button variant="outline" leftIcon={<AddIcon />} onClick={onOpen}>
      New Post
    </Button>
  );
};
