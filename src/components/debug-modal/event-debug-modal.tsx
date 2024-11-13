import { PropsWithChildren, ReactNode, useCallback, useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Heading,
  AccordionItem,
  Accordion,
  AccordionPanel,
  AccordionIcon,
  AccordionButton,
  Box,
  ModalHeader,
  Code,
  AccordionPanelProps,
  Button,
  Text,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import { ModalProps } from "@chakra-ui/react";
import { getSeenRelays } from "applesauce-core/helpers";
import { TextNoteContentSymbol } from "applesauce-content/text";
import { Root } from "applesauce-content/nast";

import { getContentPointers, getContentTagRefs, getThreadReferences } from "../../helpers/nostr/event";
import { NostrEvent } from "../../types/nostr-event";
import RawValue from "./raw-value";
import { CopyIconButton } from "../copy-icon-button";
import DebugEventTags from "./event-tags";
import { getSharableEventAddress } from "../../services/event-relay-hint";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { EditIcon } from "../icons";
import { RelayFavicon } from "../relay-favicon";
import { ErrorBoundary } from "../error-boundary";

function Section({
  label,
  children,
  actions,
  ...props
}: PropsWithChildren<{ label: string; actions?: ReactNode }> & Omit<AccordionPanelProps, "children">) {
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            {label}
          </Box>
          {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
          <AccordionIcon ml="2" />
        </AccordionButton>
      </h2>
      <AccordionPanel display="flex" flexDirection="column" gap="2" alignItems="flex-start" {...props}>
        {children}
      </AccordionPanel>
    </AccordionItem>
  );
}

function JsonCode({ data }: { data: any }) {
  return (
    <Code whiteSpace="pre" overflowX="auto" width="100%" p="4">
      {JSON.stringify(data, null, 2)}
    </Code>
  );
}

export default function EventDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  const contentRefs = useMemo(() => getContentPointers(event.content), [event]);
  const publish = usePublishEvent();
  const [loading, setLoading] = useState(false);
  const broadcast = useCallback(async () => {
    setLoading(true);
    await publish("Broadcast", event);
    setLoading(false);
  }, []);

  const nast = Reflect.get(event, TextNoteContentSymbol) as Root;

  return (
    <Modal size="6xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">{event.id}</ModalHeader>
        <ModalCloseButton />
        <ModalBody p="0">
          <Accordion allowToggle defaultIndex={event.content ? 1 : 2}>
            <Section label="IDs">
              <RawValue heading="Event Id" value={event.id} />
              <RawValue heading="NIP-19 Encoded Id" value={nip19.noteEncode(event.id)} />
              <RawValue heading="NIP-19 Pointer" value={getSharableEventAddress(event)} />
            </Section>

            <Section
              label="Content"
              p="0"
              actions={<CopyIconButton aria-label="copy json" value={event.content} size="sm" />}
            >
              <Code whiteSpace="pre" overflowX="auto" width="100%" p="4">
                {event.content}
              </Code>

              {contentRefs.length > 0 && (
                <>
                  <Heading size="md" px="2">
                    embeds
                  </Heading>
                  {contentRefs.map((pointer, i) => (
                    <>
                      <Code whiteSpace="pre" overflowX="auto" width="100%" p="4">
                        {pointer.type + "\n"}
                        {JSON.stringify(pointer.data, null, 2)}
                      </Code>
                    </>
                  ))}
                </>
              )}
            </Section>
            <Section
              label="JSON"
              p="0"
              actions={
                <>
                  <Button
                    leftIcon={<EditIcon />}
                    as={RouterLink}
                    to="/tools/publisher"
                    size="sm"
                    state={{ draft: event }}
                    colorScheme="primary"
                    mr="2"
                  >
                    Edit
                  </Button>
                  <CopyIconButton aria-label="copy json" value={JSON.stringify(event, null, 2)} size="sm" />
                </>
              }
            >
              <JsonCode data={event} />
            </Section>
            <Section label="Threading" p="0">
              <JsonCode data={getThreadReferences(event)} />
            </Section>
            <Section label="Tags">
              <ErrorBoundary>
                <DebugEventTags event={event} />
              </ErrorBoundary>
              <Heading size="sm">Tags referenced in content</Heading>
              <JsonCode data={getContentTagRefs(event.content, event.tags)} />
            </Section>
            <Section label="Relays">
              <Text>Seen on:</Text>
              {Array.from(getSeenRelays(event) ?? []).map((url) => (
                <Text gap="1" key={url}>
                  <RelayFavicon relay={url} size="xs" /> {url}
                </Text>
              ))}
              <Button onClick={broadcast} mr="auto" colorScheme="primary" isLoading={loading}>
                Broadcast
              </Button>
            </Section>
            {nast && (
              <Section label="Parsed Content" p="0">
                <JsonCode data={nast.children} />
              </Section>
            )}
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
