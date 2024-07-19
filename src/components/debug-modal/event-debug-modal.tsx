import { PropsWithChildren, ReactNode, useCallback, useState } from "react";
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
} from "@chakra-ui/react";
import { ModalProps } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { getContentTagRefs, getThreadReferences } from "../../helpers/nostr/event";
import { NostrEvent } from "../../types/nostr-event";
import RawValue from "./raw-value";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { CopyIconButton } from "../copy-icon-button";
import DebugEventTags from "./event-tags";
import relayHintService from "../../services/event-relay-hint";

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
  const publish = usePublishEvent();
  const [loading, setLoading] = useState(false);
  const broadcast = useCallback(async () => {
    setLoading(true);
    await publish("Broadcast", event);
    setLoading(false);
  }, []);

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
              <RawValue heading="NIP-19 Pointer" value={relayHintService.getSharableEventAddress(event)} />
            </Section>

            <Section
              label="Content"
              p="0"
              actions={<CopyIconButton aria-label="copy json" value={event.content} size="sm" />}
            >
              <Code whiteSpace="pre" overflowX="auto" width="100%" p="4">
                {event.content}
              </Code>
            </Section>
            <Section
              label="JSON"
              p="0"
              actions={<CopyIconButton aria-label="copy json" value={JSON.stringify(event)} size="sm" />}
            >
              <JsonCode data={event} />
            </Section>
            <Section label="Threading" p="0">
              <JsonCode data={getThreadReferences(event)} />
            </Section>
            <Section label="Tags">
              <DebugEventTags event={event} />
              <Heading size="sm">Tags referenced in content</Heading>
              <JsonCode data={getContentTagRefs(event.content, event.tags)} />
            </Section>
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
