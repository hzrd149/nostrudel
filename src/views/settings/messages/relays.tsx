import { CloseIcon, LockIcon, TimeIcon, WarningIcon } from "@chakra-ui/icons";
import {
  Flex,
  Heading,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactElement } from "react";
import { EventFactory } from "applesauce-core/factories";
import { addRelayTag, removeRelayTag } from "applesauce-core/operations/tag/relay";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import useAsyncAction from "../../../hooks/use-async-action";
import useCastUser from "../../../hooks/use-cast-user";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import AddRelayForm from "../relays/components/add-relay-form";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import pool from "../../../services/pool";

function RelayCheck({
  label,
  detail,
  icon,
  colorScheme,
}: {
  label: string;
  detail: string;
  icon: ReactElement;
  colorScheme: string;
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <IconButton aria-label={label} icon={icon} colorScheme={colorScheme} variant="ghost" />
      </PopoverTrigger>
      <Portal>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader pr="10" fontWeight="medium">
            {label}
          </PopoverHeader>
          <PopoverBody>{detail}</PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

function RelayEntry({ url, onRemove }: { url: string; onRemove: () => Promise<unknown> }) {
  const authRequiredForPublishing = use$(() => pool.relay(url).authRequiredForPublish$, [url]);
  const authRequiredForReading = use$(() => pool.relay(url).authRequiredForRead$, [url]);
  const { info } = useRelayInfo(url);
  const remove = useAsyncAction(onRemove, [onRemove]);

  return (
    <Flex gap="2" align="center" wrap="wrap">
      <RelayFavicon relay={url} />
      <RelayLink relay={url} isTruncated flex="1" minW="0" />
      <Flex gap="1" align="center" ms="auto">
        {authRequiredForReading && (
          <RelayCheck
            label="Private reading"
            detail="Authentication is required to read messages, protecting your privacy."
            icon={<LockIcon boxSize={5} />}
            colorScheme="green"
          />
        )}
        {authRequiredForPublishing && (
          <RelayCheck
            label="Restricted publishing"
            detail="Authentication is required to publish. Some users may be unable to send you messages."
            icon={<WarningIcon boxSize={5} />}
            colorScheme="orange"
          />
        )}
        {info?.supported_nips?.includes(40) && (
          <RelayCheck
            label="Disappearing messages"
            detail="This relay supports message expiration (NIP-40)."
            icon={<TimeIcon boxSize={5} />}
            colorScheme="green"
          />
        )}
        <IconButton
          aria-label="Remove relay"
          icon={<CloseIcon boxSize={5} />}
          colorScheme="red"
          variant="ghost"
          onClick={remove.run}
          isLoading={remove.loading}
        />
      </Flex>
    </Flex>
  );
}

export default function DirectMessageRelaysSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();

  const user = useCastUser(account?.pubkey);
  const dmRelayList = use$(() => user?.replaceable(kinds.DirectMessageRelaysList), [user]);
  const relays = use$(user?.directMessageRelays$) ?? [];

  const addRelay = useAsyncAction(async (relay: string) => {
    const draft = await (dmRelayList
      ? EventFactory.fromEvent(dmRelayList).modifyPublicTags(addRelayTag(relay))
      : EventFactory.fromKind(kinds.DirectMessageRelaysList).modifyPublicTags(addRelayTag(relay)));
    await publish("Add DM relay", draft);
  });

  const removeRelay = useAsyncAction(async (relay: string) => {
    if (!dmRelayList) return;
    const draft = await EventFactory.fromEvent(dmRelayList).modifyPublicTags(removeRelayTag(relay));
    await publish("Remove DM relay", draft);
  });

  return (
    <VStack spacing="4" align="stretch">
      <Heading size="md">Message inbox relays</Heading>

      <VStack spacing="2" align="stretch">
        {relays.map((relay) => (
          <RelayEntry key={relay} url={relay} onRemove={() => removeRelay.run(relay)} />
        ))}
        {relays.length === 0 && <Text>No inbox relays configured.</Text>}

        <AddRelayForm onSubmit={addRelay.run} />
      </VStack>
    </VStack>
  );
}
