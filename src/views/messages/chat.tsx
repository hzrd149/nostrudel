import { useState } from "react";
import { Button, Card, Flex, IconButton } from "@chakra-ui/react";
import { Kind, nip19 } from "nostr-tools";
import { useNavigate, useParams } from "react-router-dom";

import { ChevronLeftIcon } from "../../components/icons";
import UserAvatar from "../../components/user-avatar";
import UserLink from "../../components/user-link";
import { isHexKey } from "../../helpers/nip19";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/require-current-account";
import Message from "./message";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useCurrentAccount from "../../hooks/use-current-account";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { LightboxProvider } from "../../components/lightbox-provider";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { useDecryptionContext } from "../../providers/dycryption-provider";
import SendMessageForm from "./send-message-form";

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const { getOrCreateContainer, addToQueue, startQueue } = useDecryptionContext();

  const myInbox = useReadRelayUrls();

  const timeline = useTimelineLoader(`${pubkey}-${account.pubkey}-messages`, myInbox, [
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

  const [loading, setLoading] = useState(false);
  const decryptAll = async () => {
    const promises = messages
      .map((message) => {
        const container = getOrCreateContainer(pubkey, message.content);
        if (container.plaintext.value === undefined) return addToQueue(container);
      })
      .filter(Boolean);

    startQueue();

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <LightboxProvider>
      <IntersectionObserverProvider callback={callback}>
        <Card size="sm" flexShrink={0} p="2" flexDirection="row">
          <Flex gap="2" alignItems="center">
            <IconButton
              variant="ghost"
              icon={<ChevronLeftIcon />}
              aria-label="Back"
              onClick={() => navigate(-1)}
              hideFrom="xl"
            />
            <UserAvatar pubkey={pubkey} size="sm" />
            <UserLink pubkey={pubkey} fontWeight="bold" />
            <UserDnsIdentityIcon pubkey={pubkey} onlyIcon />
          </Flex>
          <Button onClick={decryptAll} isLoading={loading} ml="auto">
            Decrypt All
          </Button>
        </Card>
        <Flex h="0" flex={1} overflowX="hidden" overflowY="scroll" direction="column-reverse" gap="2" py="4" px="2">
          {[...messages].map((event) => (
            <Message key={event.id} event={event} />
          ))}
          <TimelineActionAndStatus timeline={timeline} />
        </Flex>
        <SendMessageForm flexShrink={0} pubkey={pubkey} />
      </IntersectionObserverProvider>
    </LightboxProvider>
  );
}

function useUserPointer() {
  const { pubkey } = useParams() as { pubkey: string };

  if (isHexKey(pubkey)) return { pubkey, relays: [] };
  const pointer = nip19.decode(pubkey);

  switch (pointer.type) {
    case "npub":
      return { pubkey: pointer.data as string, relays: [] };
    case "nprofile":
      const d = pointer.data as nip19.ProfilePointer;
      return { pubkey: d.pubkey, relays: d.relays ?? [] };
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

export default function DirectMessageChatView() {
  const { pubkey } = useUserPointer();

  return (
    <RequireCurrentAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireCurrentAccount>
  );
}
