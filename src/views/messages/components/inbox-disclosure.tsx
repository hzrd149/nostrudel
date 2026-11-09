import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

export default function InboxDisclosure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Accordion allowToggle>
      <AccordionItem border="none">
        <AccordionButton px="0">
          <Box flex="1" textAlign="left" fontWeight="semibold">
            {label}
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel px="0">{children}</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
