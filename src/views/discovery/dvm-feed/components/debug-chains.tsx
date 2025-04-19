import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Heading,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ChainedDVMJob, getEventIdsFromJobs, getRequestInput, getRequestRelays } from "../../../../helpers/nostr/dvm";
import dayjs from "dayjs";
import { truncatedId } from "../../../../helpers/nostr/event";
import { CopyIconButton } from "../../../../components/copy-icon-button";
import { NostrEvent } from "nostr-tools";
import UserLink from "../../../../components/user/user-link";

function JobResult({ result }: { result: NostrEvent }) {
  return (
    <>
      <Text isTruncated>
        ID: {truncatedId(result.id)} <CopyIconButton size="xs" aria-label="copy id" value={result.id} />
      </Text>
      <Flex gap="2" alignItems="center" overflow="hidden">
        <Text isTruncated>Content: {result.content}</Text>{" "}
        <CopyIconButton size="xs" aria-label="copy content" value={result.content} />
      </Flex>
    </>
  );
}
function JobStatus({ status }: { status: NostrEvent }) {
  return (
    <>
      <Text isTruncated>
        ID: {truncatedId(status.id)} <CopyIconButton size="xs" aria-label="copy id" value={status.id} />
      </Text>
      <Text isTruncated>Status: {status.tags.find((t) => t[0] === "status")?.[1]}</Text>
      <Text isTruncated>Content: {status.content}</Text>
    </>
  );
}

function ChainedJob({ job }: { job: ChainedDVMJob }) {
  const input = getRequestInput(job.request);
  const showNext = useDisclosure();
  const showPrev = useDisclosure();

  return (
    <Card p="2" variant="outline">
      <Text>
        ID: {job.request.id} <CopyIconButton size="xs" aria-label="copy id" value={job.request.id} />
      </Text>
      {input && (
        <Text>
          Input: {truncatedId(input.value)} ({input.type})
        </Text>
      )}
      <Heading size="sm">Relays:</Heading>
      <Text>{getRequestRelays(job.request).join(", ")}</Text>
      <Divider my="2" />
      {job.responses.map((response) => (
        <>
          <Heading>
            <UserLink pubkey={response.pubkey} />
          </Heading>
          <Heading size="sm">Status:</Heading>
          {response.status ? <JobStatus status={response.status} /> : <Spinner />}
          <Divider my="2" />
          <Heading size="sm">Result:</Heading>
          {response.result ? <JobResult result={response.result} /> : <Spinner />}
        </>
      ))}
      <Divider my="2" />
      {job.prev && (
        <>
          <Flex gap="2" alignItems="center">
            <Heading size="sm">Previous ({truncatedId(job.prev.request.id)}):</Heading>
            <Button onClick={showPrev.onToggle} size="xs">
              {showPrev.isOpen ? "Hide" : "Show"}
            </Button>
          </Flex>
          {showPrev.isOpen && <ChainedJob job={job.prev} />}
          <Divider my="2" />
        </>
      )}
      {job.next.length > 0 && (
        <>
          <Flex gap="2" alignItems="center">
            <Heading size="sm">Next ({job.next.length}):</Heading>
            <Button onClick={showNext.onToggle} size="xs">
              {showNext.isOpen ? "Hide" : "Show"}
            </Button>
          </Flex>
          {showNext.isOpen && (
            <Flex gap="2" direction="column">
              {job.next.map((next) => (
                <ChainedJob key={next.request.id} job={next} />
              ))}
            </Flex>
          )}
        </>
      )}
    </Card>
  );
}

function DebugChain({ chain }: { chain: ChainedDVMJob[] }) {
  const showPages = useDisclosure();

  return (
    <>
      <Text>Events: {getEventIdsFromJobs(chain).length}</Text>

      <Flex gap="2" alignItems="center">
        <Heading size="sm">Pages ({chain.length}):</Heading>
        <Button size="xs" onClick={showPages.onToggle}>
          {showPages.isOpen ? "Hide" : "Show"}
        </Button>
      </Flex>
      {showPages.isOpen && (
        <Flex gap="2" direction="column">
          {chain.map((job) => (
            <ChainedJob key={job.request.id} job={job} />
          ))}
        </Flex>
      )}
    </>
  );
}

export default function DebugChains({ chains }: { chains: ChainedDVMJob[][] }) {
  return (
    <Accordion>
      {chains.map((chain) => (
        <AccordionItem key={chain[0].request.id}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                {dayjs.unix(chain[0].request.created_at).fromNow()}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <DebugChain chain={chain} />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
