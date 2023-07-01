import { useCallback, useMemo, useRef } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  IconButton,
  Input,
  Spacer,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ParsedStream, buildChatMessage, getATag } from "../../../../helpers/nostr/stream";
import { useTimelineLoader } from "../../../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../../../hooks/use-client-relays";
import { useAdditionalRelayContext } from "../../../../providers/additional-relay-context";
import useSubject from "../../../../hooks/use-subject";
import { truncatedId } from "../../../../helpers/nostr-event";
import { UserAvatar } from "../../../../components/user-avatar";
import { UserLink } from "../../../../components/user-link";
import { DraftNostrEvent, NostrEvent } from "../../../../types/nostr-event";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import { embedUrls } from "../../../../helpers/embeds";
import { embedEmoji, renderGenericUrl, renderImageUrl } from "../../../../components/embed-types";
import EmbeddedContent from "../../../../components/embeded-content";
import { useForm } from "react-hook-form";
import { useSigningContext } from "../../../../providers/signing-provider";
import { nostrPostAction } from "../../../../classes/nostr-post-action";
import { useUserRelays } from "../../../../hooks/use-user-relays";
import { RelayMode } from "../../../../classes/relay";
import { unique } from "../../../../helpers/array";
import { LightningIcon } from "../../../../components/icons";
import { parseZapEvent, requestZapInvoice } from "../../../../helpers/zaps";
import { readablizeSats } from "../../../../helpers/bolt11";
import { Kind } from "nostr-tools";
import useUserLNURLMetadata from "../../../../hooks/use-user-lnurl-metadata";
import { useInvoiceModalContext } from "../../../../providers/invoice-modal";

function ChatMessage({ event, stream }: { event: NostrEvent; stream: ParsedStream }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const content = useMemo(() => {
    let c = embedUrls([event.content], [renderImageUrl, renderGenericUrl]);
    c = embedEmoji(c, event);
    return c;
  }, [event.content]);

  return (
    <Flex direction="column" ref={ref}>
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink
          pubkey={event.pubkey}
          fontWeight="bold"
          color={event.pubkey === stream.author ? "rgb(248, 56, 217)" : "cyan"}
        />
        <Spacer />
        <Text>{dayjs.unix(event.created_at).fromNow()}</Text>
      </Flex>
      <Box>
        <EmbeddedContent content={content} />
      </Box>
    </Flex>
  );
}

function ZapMessage({ zap, stream }: { zap: NostrEvent; stream: ParsedStream }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, zap.id);

  const { request, payment } = parseZapEvent(zap);
  const content = useMemo(() => {
    let c = embedUrls([request.content], [renderImageUrl, renderGenericUrl]);
    c = embedEmoji(c, request);
    return c;
  }, [request.content]);

  if (!payment.amount) return null;

  return (
    <Flex direction="column" borderRadius="md" borderColor="yellow.400" borderWidth="1px" p="2" ref={ref}>
      <Flex gap="2">
        <LightningIcon color="yellow.400" />
        <UserAvatar pubkey={zap.pubkey} size="xs" />
        <UserLink pubkey={request.pubkey} fontWeight="bold" color="yellow.400" />
        <Text>zapped {readablizeSats(payment.amount / 1000)} sats</Text>
        <Spacer />
        <Text>{dayjs.unix(request.created_at).fromNow()}</Text>
      </Flex>
      <Box>
        <EmbeddedContent content={content} />
      </Box>
    </Flex>
  );
}

export default function StreamChat({ stream, ...props }: CardProps & { stream: ParsedStream }) {
  const toast = useToast();
  const contextRelays = useAdditionalRelayContext();
  const readRelays = useReadRelayUrls(contextRelays);
  const writeRelays = useUserRelays(stream.author)
    .filter((r) => r.mode & RelayMode.READ)
    .map((r) => r.url);

  const timeline = useTimelineLoader(`${truncatedId(stream.event.id)}-chat`, readRelays, {
    "#a": [getATag(stream)],
    kinds: [1311, 9735],
  });

  const events = useSubject(timeline.timeline).sort((a, b) => b.created_at - a.created_at);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const { requestSignature } = useSigningContext();
  const { register, handleSubmit, formState, reset, getValues } = useForm({
    defaultValues: { content: "" },
  });
  const sendMessage = handleSubmit(async (values) => {
    try {
      const draft = buildChatMessage(stream, values.content);
      const signed = await requestSignature(draft);
      if (!signed) throw new Error("Failed to sign");
      nostrPostAction(unique([...contextRelays, ...writeRelays]), signed);
      reset();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message });
    }
  });

  const { requestPay } = useInvoiceModalContext();
  const zapMetadata = useUserLNURLMetadata(stream.author);
  const zapMessage = async () => {
    try {
      if (!zapMetadata.metadata?.callback) throw new Error("bad lnurl endpoint");

      const content = getValues().content;
      const amount = 100;
      const zapRequest: DraftNostrEvent = {
        kind: Kind.ZapRequest,
        created_at: dayjs().unix(),
        content,
        tags: [
          ["p", stream.author],
          ["a", getATag(stream)],
          ["relays", ...writeRelays],
          ["amount", String(amount * 1000)],
        ],
      };

      const signed = await requestSignature(zapRequest);
      if (!signed) throw new Error("Failed to sign");

      const invoice = await requestZapInvoice(signed, zapMetadata.metadata.callback);
      await requestPay(invoice);

      reset();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message });
    }
  };

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <Card {...props} overflow="hidden">
        <CardHeader py="3">
          <Heading size="md">Stream Chat</Heading>
        </CardHeader>
        <CardBody display="flex" flexDirection="column" gap="2" overflow="hidden" p={0}>
          <Flex
            overflowY="scroll"
            overflowX="hidden"
            ref={scrollBox}
            direction="column-reverse"
            flex={1}
            px="4"
            py="2"
            gap="2"
          >
            {events.map((event) =>
              event.kind === 1311 ? (
                <ChatMessage key={event.id} event={event} stream={stream} />
              ) : (
                <ZapMessage key={event.id} zap={event} stream={stream} />
              )
            )}
          </Flex>
          <Box as="form" borderRadius="md" flexShrink={0} display="flex" gap="2" px="2" pb="2" onSubmit={sendMessage}>
            <Input placeholder="Message" {...register("content", { required: true })} autoComplete="off" />
            <Button colorScheme="brand" type="submit" isLoading={formState.isSubmitting}>
              Send
            </Button>
            {zapMetadata.metadata?.allowsNostr && (
              <IconButton
                icon={<LightningIcon color="yellow.400" />}
                aria-label="Zap stream"
                borderColor="yellow.400"
                variant="outline"
                onClick={zapMessage}
              />
            )}
          </Box>
        </CardBody>
      </Card>
    </IntersectionObserverProvider>
  );
}
