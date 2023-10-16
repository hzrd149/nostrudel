import { useState } from "react";
import { Button, Card, CardBody, Flex, IconButton, Textarea, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { ChevronLeftIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { normalizeToHex } from "../../helpers/nip19";
import useSubject from "../../hooks/use-subject";
import { useSigningContext } from "../../providers/signing-provider";
import clientRelaysService from "../../services/client-relays";
import { DraftNostrEvent } from "../../types/nostr-event";
import RequireCurrentAccount from "../../providers/require-current-account";
import { Message } from "./message";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import NostrPublishAction from "../../classes/nostr-publish-action";
import { LightboxProvider } from "../../components/lightbox-provider";

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const toast = useToast();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const { requestEncrypt, requestSignature } = useSigningContext();
  const [content, setContent] = useState<string>("");

  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(`${pubkey}-${account.pubkey}-messages`, readRelays, [
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
    try {
      if (!content) return;
      const encrypted = await requestEncrypt(content, pubkey);
      const event: DraftNostrEvent = {
        kind: Kind.EncryptedDirectMessage,
        content: encrypted,
        tags: [["p", pubkey]],
        created_at: dayjs().unix(),
      };
      const signed = await requestSignature(event);
      const writeRelays = clientRelaysService.getWriteUrls();
      const pub = new NostrPublishAction("Send DM", writeRelays, signed);
      setContent("");
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <LightboxProvider>
      <IntersectionObserverProvider callback={callback}>
        <Flex height="100%" overflow="hidden" direction="column">
          <Card size="sm" flexShrink={0}>
            <CardBody display="flex" gap="2" alignItems="center">
              <IconButton variant="ghost" icon={<ChevronLeftIcon />} aria-label="Back" onClick={() => navigate(-1)} />
              <UserAvatar pubkey={pubkey} size="sm" />
              <UserLink pubkey={pubkey} />
            </CardBody>
          </Card>
          <Flex flex={1} overflowX="hidden" overflowY="scroll" direction="column-reverse" gap="2" py="4" px="2">
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
    </LightboxProvider>
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
