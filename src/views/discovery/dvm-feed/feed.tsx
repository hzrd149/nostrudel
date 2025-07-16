import {
  Button,
  ButtonGroup,
  Code,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import { addRelayHintsToPointer, getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import dayjs from "dayjs";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";
import { useEffect, useMemo, useState } from "react";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import DVMFeedFavoriteButton from "../../../components/dvm/dvm-feed-favorite-button";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import Timestamp from "../../../components/timestamp";
import {
  chainJobs,
  DVM_CONTENT_DISCOVERY_JOB_KIND,
  DVM_CONTENT_DISCOVERY_RESULT_KIND,
  DVM_STATUS_KIND,
  flattenJobChain,
  groupEventsIntoJobs,
} from "../../../helpers/nostr/dvm";
import useAddressableEvent from "../../../hooks/use-addressable-event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import DebugChains from "./components/debug-chains";
import DVMAvatar from "./components/dvm-avatar";
import { DVMName } from "./components/dvm-name";
import Feed from "./components/feed";

function DVMFeedPage({ pointer, dvm }: { pointer: AddressPointer; dvm?: NostrEvent }) {
  const [since] = useState(() => dayjs().subtract(1, "day").unix());
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const debugModal = useDisclosure();

  const dvmRelays = useUserOutbox(pointer.pubkey);
  const readRelays = useReadRelays(dvmRelays);
  const { timeline } = useTimelineLoader(`${getCoordinateFromAddressPointer(pointer)}-jobs`, readRelays, {
    authors: [account.pubkey, pointer.pubkey],
    "#p": [account.pubkey, pointer.pubkey],
    kinds: [DVM_CONTENT_DISCOVERY_JOB_KIND, DVM_CONTENT_DISCOVERY_RESULT_KIND, DVM_STATUS_KIND],
    since,
  });

  const pointerWithRelays = useMemo(() => addRelayHintsToPointer(pointer, dvmRelays), [pointer, dvmRelays]);

  const jobs = groupEventsIntoJobs(timeline);
  const pages = chainJobs(Array.from(Object.values(jobs)));
  const jobChains = flattenJobChain(pages);

  const [params, setParams] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState(false);
  const requestNewFeed = async () => {
    setRequesting(true);

    const paramTags = Object.entries(params).map(([key, value]) => ["param", key, value]);
    const draft: EventTemplate = {
      kind: DVM_CONTENT_DISCOVERY_JOB_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [
        ["p", pointer.pubkey],
        ["relays", ...readRelays],
        ["expiration", String(dayjs().add(1, "day").unix())],
        ...paramTags,
      ],
    };

    await publish("Request Feed", draft, dvmRelays);
  };

  useEffect(() => {
    setRequesting(false);
  }, [timeline.length]);

  return (
    <SimpleView
      title={
        <Flex gap="2" alignItems="center">
          <DVMAvatar pointer={pointer} w="10" />
          <DVMName pointer={pointer} />
        </Flex>
      }
      actions={
        <ButtonGroup ms="auto" variant="ghost">
          <Button onClick={requestNewFeed} isLoading={requesting} colorScheme="primary">
            New Feed
          </Button>
          <DVMFeedFavoriteButton pointer={pointer} />
          {dvm && <DebugEventButton event={dvm} />}
        </ButtonGroup>
      }
      center
      maxW="container.xl"
    >
      {jobChains[0] ? (
        <Feed chain={jobChains[0]} pointer={pointerWithRelays} />
      ) : (
        <Flex direction="column" alignItems="center" justifyContent="center" flex={1}>
          <Heading>Request a new feed</Heading>
          <Text>DVM feeds require you to sign an event to request a new feed of notes.</Text>
          <Button onClick={requestNewFeed} isLoading={requesting} colorScheme="primary" size="lg" mt="4">
            New Feed
          </Button>
        </Flex>
      )}

      {debugModal.isOpen && (
        <Modal isOpen onClose={debugModal.onClose} size="full">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Jobs</ModalHeader>
            <ModalCloseButton />
            <ModalBody p="0">
              <Heading size="sm" my="2" mx="4">
                Events
              </Heading>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Kind</Th>
                      <Th>Time</Th>
                      <Th>Tags</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {timeline.map((event) => (
                      <>
                        <Tr key={event.id}>
                          <Td fontWeight="bold">{event.kind}</Td>
                          <Td>
                            <Timestamp timestamp={event.created_at} />
                          </Td>
                          <Td>
                            <Text maxW="80vw" isTruncated whiteSpace="pre">
                              {event.tags.map((t) => t.join(", ")).join("\n")}
                            </Text>
                          </Td>
                        </Tr>
                        {event.content && (
                          <Tr>
                            <Td colSpan={3} p="0">
                              <Code maxW="100vw" key={event.id + "-content"} isTruncated whiteSpace="pre" p="2">
                                {event.content}
                              </Code>
                            </Td>
                          </Tr>
                        )}
                      </>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              <Heading size="sm" my="2" mx="4">
                Chains
              </Heading>
              <DebugChains chains={jobChains} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </SimpleView>
  );
}

export default function DVMFeedView() {
  const pointer = useParamsAddressPointer("addr");
  const dvm = useAddressableEvent(pointer);

  return (
    <RequireActiveAccount>
      <DVMFeedPage pointer={pointer} dvm={dvm} />
    </RequireActiveAccount>
  );
}
