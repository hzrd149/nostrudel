import { useEffect, useState } from "react";
import {
  Button,
  Code,
  Flex,
  Heading,
  IconButton,
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
import { ChevronLeftIcon } from "@chakra-ui/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  DVM_CONTENT_DISCOVERY_JOB_KIND,
  DVM_CONTENT_DISCOVERY_RESULT_KIND,
  DVM_STATUS_KIND,
  flattenJobChain,
  chainJobs,
  groupEventsIntoJobs,
} from "../../../helpers/nostr/dvm";
import { DraftNostrEvent } from "../../../types/nostr-event";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";
import RequireCurrentAccount from "../../../providers/route/require-current-account";
import { CodeIcon } from "../../../components/icons";
import DebugChains from "./components/debug-chains";
import Feed from "./components/feed";
import { AddressPointer } from "nostr-tools/nip19";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";
import DVMParams from "./components/dvm-params";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { getHumanReadableCoordinate } from "../../../services/replaceable-events";
import Timestamp from "../../../components/timestamp";

function DVMFeedPage({ pointer }: { pointer: AddressPointer }) {
  const [since] = useState(() => dayjs().subtract(1, "day").unix());
  const publish = usePublishEvent();
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const debugModal = useDisclosure();

  const dvmRelays = useUserOutbox(pointer.pubkey);
  const readRelays = useReadRelays(dvmRelays);
  const { loader, timeline } = useTimelineLoader(
    `${getHumanReadableCoordinate(pointer.kind, pointer.pubkey, pointer.identifier)}-jobs`,
    readRelays,
    {
      authors: [account.pubkey, pointer.pubkey],
      "#p": [account.pubkey, pointer.pubkey],
      kinds: [DVM_CONTENT_DISCOVERY_JOB_KIND, DVM_CONTENT_DISCOVERY_RESULT_KIND, DVM_STATUS_KIND],
      since,
    },
  );

  const jobs = groupEventsIntoJobs(timeline);
  const pages = chainJobs(Array.from(Object.values(jobs)));
  const jobChains = flattenJobChain(pages);

  const [params, setParams] = useState<Record<string, string>>({});
  const [requesting, setRequesting] = useState(false);
  const requestNewFeed = async () => {
    setRequesting(true);

    const paramTags = Object.entries(params).map(([key, value]) => ["param", key, value]);
    const draft: DraftNostrEvent = {
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
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon boxSize={6} />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <DVMParams pointer={pointer} params={params} onChange={setParams} />
        <Button onClick={requestNewFeed} isLoading={requesting} colorScheme="primary">
          New Feed
        </Button>
        <IconButton icon={<CodeIcon />} ml="auto" aria-label="View Raw" title="View Raw" onClick={debugModal.onOpen} />
      </Flex>

      {jobChains[0] && <Feed chain={jobChains[0]} pointer={pointer} />}

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
    </VerticalPageLayout>
  );
}

export default function DVMFeedView() {
  const pointer = useParamsAddressPointer("addr");

  return (
    <RequireCurrentAccount>
      <DVMFeedPage pointer={pointer} />
    </RequireCurrentAccount>
  );
}
