import { useContext } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Heading,
  Spacer,
  Text,
} from "@chakra-ui/react";

import PublishActionStatusTag from "./action-status-tag";
import { PublishContext, PublishLogEntry } from "../../../providers/global/publish-provider";
import { PublishLogEntryDetails } from "./entry-details";

function PublishLogAction({ entry }: { entry: PublishLogEntry }) {
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Text isTruncated>{entry.label}</Text>
          <Spacer />
          <PublishActionStatusTag ml="auto" entry={entry} flexShrink={0} />
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <PublishLogEntryDetails entry={entry} />
      </AccordionPanel>
    </AccordionItem>
  );
}

export default function PublishLogView() {
  const { log } = useContext(PublishContext);
  const reverseLog = Array.from(log).reverse();

  return (
    <Accordion>
      {reverseLog.length === 0 && (
        <Heading mx="auto" mt="10" size="md" textAlign="center">
          No events published yet
        </Heading>
      )}
      {reverseLog.map((entry) => (
        <PublishLogAction key={entry.id} entry={entry} />
      ))}
    </Accordion>
  );
}
