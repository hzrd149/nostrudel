import { Button, Flex, IconButton, Image, Input, Text } from "@chakra-ui/react";
import type { MessageDraft } from "applesauce-extra/messages";
import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { unixNow } from "applesauce-core/helpers";
import { useForm, useWatch } from "react-hook-form";
import { concatWith, defer, finalize, NEVER, of } from "rxjs";

import { CloseIcon } from "@chakra-ui/icons";
import MagicTextArea from "../../../components/magic-textarea";
import useAsyncAction from "../../../hooks/use-async-action";
import useMessaging from "../../../hooks/use-messaging";
import type { OutgoingMessage } from "../../../services/messaging/wrapped-outbox";
import MessageParent from "./message-parent";
import UserName from "../../../components/user/user-name";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";

function StagedPreview({ file }: { file: File }) {
  const url = use$(
    () =>
      defer(() => {
        if (!file.type.startsWith("image/")) return of(undefined);
        const source = URL.createObjectURL(file);
        return of(source).pipe(
          concatWith(NEVER),
          finalize(() => URL.revokeObjectURL(source)),
        );
      }),
    [file],
  );
  return url ? <Image src={url} alt={file.name} boxSize="12" objectFit="cover" /> : null;
}

export default function WrappedComposer({
  recipients,
  expiration,
  controls,
}: {
  recipients: string[];
  expiration?: number | null;
  controls?: ReactNode;
}) {
  const session = useMessaging();
  const key = [...new Set(recipients)].sort().join(",");
  const outbox = useMemo(() => session?.outbox(key.split(",")), [session, key]);
  const conversation = outbox?.conversation;
  const draft = use$(() => conversation?.draft$, [conversation]);
  const items = use$(() => outbox?.items$, [outbox]) ?? [];
  const [ready, setReady] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { control, getValues, reset, setValue } = useForm<{ content: string; files: File[] }>({
    defaultValues: { content: "", files: [] },
  });
  const content = useWatch({ control, name: "content" });
  const files = useWatch({ control, name: "files" });
  const reply = useRef<string>();
  reply.current = draft?.replyTo;
  const restore = useAsyncAction(
    async (signal: AbortSignal) => {
      if (!conversation) return;
      const saved = await conversation.loadDraft();
      if (signal.aborted) return;
      reset({ content: saved?.content ?? "", files: [...(saved?.files ?? [])] });
      setReady(true);
    },
    [conversation, reset],
  );
  useEffect(() => {
    setReady(false);
    const controller = new AbortController();
    void restore.run(controller.signal);
    return () => controller.abort();
  }, [restore.run]);

  const save = useAsyncAction(
    async (next: MessageDraft) => {
      await conversation?.setDraft(next);
    },
    [conversation],
  );
  // Save edits immediately to preserve the latest text even when a route change unmounts the composer.
  const edit = (next: { content: string; files: File[] }) => {
    setValue("content", next.content);
    setValue("files", next.files);
    void save.run({ ...next, replyTo: reply.current });
  };
  const stage = (picked: File[]) => edit({ ...getValues(), files: [...getValues("files"), ...picked] });
  const cancelReply = useAsyncAction(async () => {
    await conversation?.setDraft({ ...getValues(), replyTo: undefined });
  }, [conversation]);
  const send = useAsyncAction(async () => {
    if (!conversation || !outbox || !ready) return;
    const values = getValues();
    const replyTo = reply.current;
    if (!values.content.trim() && !values.files.length) return;
    // Save before queueing; a storage error leaves the editor intact.
    await conversation.setDraft({ ...values, replyTo });
    await conversation.clearDraft();
    const queued = outbox.enqueue({ ...values, replyTo, expiration: expiration ? unixNow() + expiration : undefined });
    reset({ content: "", files: [] });
    for (const item of queued) void outbox.retry(item);
  }, [conversation, outbox, ready, expiration]);
  const retry = useAsyncAction(
    async (item: OutgoingMessage) => {
      await outbox?.retry(item);
    },
    [outbox],
  );

  return (
    <Flex direction="column" gap="2" p="2" flexShrink={0} maxH="60%" overflowY="auto">
      {draft?.replyTo && conversation && (
        <Flex gap="2" align="center">
          <MessageParent conversation={conversation} id={draft.replyTo} />
          <IconButton
            aria-label="Cancel reply"
            icon={<CloseIcon boxSize={5} />}
            onClick={cancelReply.run}
            isDisabled={send.loading}
          />
        </Flex>
      )}
      {items
        .filter((item) => item.state !== "accepted")
        .map((item) => (
          <Flex key={item.id} direction="column" gap="1">
            <Text noOfLines={2}>{item.file?.name || item.content || "Attachment"}</Text>
            {item.prepared?.publications.map((result) => (
              <Text key={result.recipient}>
                <UserName pubkey={result.recipient} />:{" "}
                {result.accepted ? "Accepted by relay" : result.error ? "Failed" : "Pending"}
              </Text>
            ))}
            <Flex gap="2" align="center" wrap="wrap">
              <Text color={item.error ? "red.500" : "GrayText"}>{item.error ?? item.state}</Text>
              {(item.state === "failed" || item.state === "queued") && (
                <>
                  <Button onClick={() => retry.run(item)}>Retry send</Button>
                  <Button variant="ghost" onClick={() => outbox?.discard(item)}>
                    Discard
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        ))}
      {files.map((file, index) => (
        <Flex key={`${index}:${file.name}`} gap="2" align="center">
          <StagedPreview file={file} />
          <Text isTruncated>{file.name}</Text>
          <IconButton
            aria-label={`Remove ${file.name}`}
            icon={<CloseIcon boxSize={5} />}
            isDisabled={send.loading}
            onClick={() => edit({ ...getValues(), files: files.filter((_, i) => i !== index) })}
          />
        </Flex>
      ))}
      <Flex
        gap="2"
        as="form"
        onSubmit={(event) => {
          event.preventDefault();
          void send.run();
        }}
      >
        <Flex direction="column" gap="2">
          <Flex gap="1">
            <InsertGifButton
              aria-label="Add gif"
              isDisabled={!ready || send.loading}
              onSelectURL={(url) => edit({ ...getValues(), content: `${getValues("content")} ${url}`.trim() })}
            />
            <InsertReactionButton
              aria-label="Add emoji"
              isDisabled={!ready || send.loading}
              onSelect={(text) => edit({ ...getValues(), content: getValues("content") + text })}
            />
          </Flex>
          {controls}
        </Flex>
        <MagicTextArea
          value={content}
          rows={2}
          isDisabled={!ready || send.loading}
          onChange={(event) => edit({ ...getValues(), content: event.target.value })}
          onPaste={(event) => {
            if (event.clipboardData.files.length) {
              event.preventDefault();
              stage([...event.clipboardData.files]);
            }
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void send.run();
            }
          }}
        />
        <Flex direction="column" gap="2">
          <Button onClick={() => input.current?.click()} isDisabled={!ready || send.loading}>
            Attach
          </Button>
          <Input
            ref={input}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              stage([...(event.target.files ?? [])]);
              event.target.value = "";
            }}
          />
          <Button
            colorScheme="primary"
            type="submit"
            isDisabled={!ready || (!content.trim() && !files.length)}
            isLoading={send.loading}
          >
            Send
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
