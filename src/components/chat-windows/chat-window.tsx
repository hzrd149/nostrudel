import { useState } from "react";
import { Button, Card, CardBody, CardHeader, CloseButton, Flex, Heading, IconButton, useToast } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

import { ChevronDownIcon, ChevronUpIcon } from "../icons";
import UserName from "../user-name";
import MagicTextArea from "../magic-textarea";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls, useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useUserRelays } from "../../hooks/use-user-relays";
import { RelayMode } from "../../classes/relay";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import Message from "../../views/messages/message";
import { LightboxProvider } from "../lightbox-provider";
import { useSigningContext } from "../../providers/signing-provider";
import { DraftNostrEvent } from "../../types/nostr-event";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { correctContentMentions, createEmojiTags } from "../../helpers/nostr/post";
import { useContextEmojis } from "../../providers/emoji-provider";

export default function ChatWindow({ pubkey, onClose }: { pubkey: string; onClose: () => void }) {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const emojis = useContextEmojis();
  const [expanded, setExpanded] = useState(true);

  const usersRelays = useUserRelays(pubkey);
  const readRelays = useReadRelayUrls(usersRelays.filter((c) => c.mode & RelayMode.WRITE).map((c) => c.url));
  const writeRelays = useWriteRelayUrls(usersRelays.filter((c) => c.mode & RelayMode.WRITE).map((c) => c.url));

  const timeline = useTimelineLoader(`${pubkey}-${account.pubkey}-messages`, readRelays, [
    { authors: [account.pubkey], kinds: [Kind.EncryptedDirectMessage], "#p": [pubkey] },
    { authors: [pubkey], kinds: [Kind.EncryptedDirectMessage], "#p": [account.pubkey] },
  ]);

  const { handleSubmit, getValues, setValue, formState, watch, reset } = useForm({ defaultValues: { content: "" } });
  watch("content");
  const { requestSignature, requestEncrypt } = useSigningContext();
  const submit = handleSubmit(async (values) => {
    try {
      if (!values.content) return;
      let draft: DraftNostrEvent = {
        kind: Kind.EncryptedDirectMessage,
        content: values.content,
        tags: [["p", pubkey]],
        created_at: dayjs().unix(),
      };

      draft = createEmojiTags(draft, emojis);
      draft.content = correctContentMentions(draft.content);

      // encrypt content
      draft.content = await requestEncrypt(draft.content, pubkey);

      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction("Send DM", writeRelays, signed);

      reset();
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  });

  const messages = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <Card size="sm" borderRadius="md" w={expanded ? "md" : "xs"} variant="outline">
      <CardHeader display="flex" gap="2" alignItems="center">
        <Heading size="md" mr="8">
          <UserName pubkey={pubkey} />
        </Heading>
        <IconButton
          aria-label="Toggle Window"
          onClick={() => setExpanded((v) => !v)}
          variant="ghost"
          icon={expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          ml="auto"
          size="sm"
        />
        <CloseButton onClick={onClose} />
      </CardHeader>
      {expanded && (
        <>
          <CardBody
            maxH="lg"
            overflowX="hidden"
            overflowY="auto"
            pt="0"
            display="flex"
            flexDirection="column-reverse"
            gap="2"
          >
            <LightboxProvider>
              <IntersectionObserverProvider callback={callback}>
                {messages.map((event) => (
                  <Message key={event.id} event={event} />
                ))}
              </IntersectionObserverProvider>
            </LightboxProvider>
          </CardBody>
          <Flex as="form" onSubmit={submit} gap="2">
            <MagicTextArea
              isRequired
              value={getValues().content}
              onChange={(e) => setValue("content", e.target.value, { shouldDirty: true })}
            />
            <Button type="submit" isLoading={formState.isSubmitting}>
              Send
            </Button>
          </Flex>
        </>
      )}
    </Card>
  );
}
