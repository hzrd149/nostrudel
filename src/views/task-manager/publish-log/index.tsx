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

import PublishAction from "../../../classes/nostr-publish-action";
import PublishActionStatusTag from "./action-status-tag";
import { PublishContext } from "../../../providers/global/publish-provider";
import { PublishDetails } from "./publish-details";

function PublishLogAction({ action }: { action: PublishAction }) {
  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Text isTruncated>{action.label}</Text>
          <Spacer />
          <PublishActionStatusTag ml="auto" action={action} flexShrink={0} />
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        <PublishDetails pub={action} />
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
      {reverseLog.map((action) => (
        <PublishLogAction key={action.id} action={action} />
      ))}
    </Accordion>
  );
}
