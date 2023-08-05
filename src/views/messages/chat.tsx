import { Button, Card, CardBody, Flex, IconButton, Textarea } from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";
import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { ArrowLeftSIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { normalizeToHex } from "../../helpers/nip19";
import { useIsMobile } from "../../hooks/use-is-mobile";
import useSubject from "../../hooks/use-subject";
import { useSigningContext } from "../../providers/signing-provider";
import clientRelaysService from "../../services/client-relays";
import { DraftNostrEvent } from "../../types/nostr-event";
import RequireCurrentAccount from "../../providers/require-current-account";
import { Message } from "./message";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { truncatedId } from "../../helpers/nostr/event";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const isMobile = useIsMobile();
  const account = useCurrentAccount()!;
  const { requestEncrypt, requestSignature } = useSigningContext();
  const [content, setContent] = useState<string>("");

  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(`${truncatedId(pubkey)}-${truncatedId(account.pubkey)}-messages`, readRelays, [
    {
      kinds: [Kind.EncryptedDirectMessage],
      "#p": [account.pubkey],
      authors: [pubkey],
    },
    {
      kinds: [Kind.EncryptedDirectMessage],
      "#p": [pubkey],
      authors: [account.pubkey],
    },
  ]);

  const messages = useSubject(timeline.timeline);

  const sendMessage = async () => {
    if (!content) return;
    const encrypted = await requestEncrypt(content, pubkey);
    if (!encrypted) return;
    const event: DraftNostrEvent = {
      kind: Kind.EncryptedDirectMessage,
      content: encrypted,
      tags: [["p", pubkey]],
      created_at: dayjs().unix(),
    };
    const signed = await requestSignature(event);
    if (!signed) return;
    const writeRelays = clientRelaysService.getWriteUrls();
    nostrPostAction(writeRelays, signed);
    setContent("");
  };

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex height="100%" overflow="hidden" direction="column">
        <Card size="sm" flexShrink={0}>
          <CardBody display="flex" gap="2" alignItems="center">
            <IconButton
              as={Link}
              variant="ghost"
              icon={<ArrowLeftSIcon />}
              aria-label="Back"
              to="/dm"
              size={isMobile ? "sm" : "md"}
            />
            <UserAvatar pubkey={pubkey} size={isMobile ? "sm" : "md"} />
            <UserLink pubkey={pubkey} />
          </CardBody>
        </Card>
        <Flex flex={1} overflowX="hidden" overflowY="scroll" direction="column-reverse" gap="4" py="4">
          {[...messages].map((event) => (
            <Message key={event.id} event={event} />
          ))}
          <TimelineActionAndStatus timeline={timeline} />
        </Flex>
        <Flex shrink={0}>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
          <Button isDisabled={!content} onClick={sendMessage}>
            Send
          </Button>
        </Flex>
      </Flex>
    </IntersectionObserverProvider>
  );
}
export default function DirectMessageChatView() {
  const { key } = useParams();
  if (!key) return <Navigate to="/" />;
  const pubkey = normalizeToHex(key);
  if (!pubkey) throw new Error("invalid pubkey");
  return (
    <RequireCurrentAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireCurrentAccount>
  );
}
