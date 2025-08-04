import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react";

import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import useParamsProfilePointer from "../../../../hooks/use-params-pubkey-pointer";
import useRouteStateValue from "../../../../hooks/use-route-state-value";
import BlossomServersSection from "./blossom";
import MailboxSection from "./mailboxes";
import NIP05DebugSection from "./nip-05";
import ProfileSection from "./profile";

export default function UserAdvancedTab() {
  const user = useParamsProfilePointer("pubkey");
  const section = useRouteStateValue<number | number[]>("section", 0);

  return (
    <ScrollLayout maxW="6xl" center flush>
      <Accordion index={section.value} onChange={(v) => section.setValue(v)} mb={10}>
        {/* Profile Section */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                Profile Metadata
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <ProfileSection user={user} />
          </AccordionPanel>
        </AccordionItem>

        {/* NIP-05 Debug Section */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                NIP-05 Identity
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <NIP05DebugSection user={user} />
          </AccordionPanel>
        </AccordionItem>

        {/* Relays Section */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                Relay mailboxes
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <MailboxSection user={user} />
          </AccordionPanel>
        </AccordionItem>

        {/* Blossom Servers Section */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                Blossom Servers
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <BlossomServersSection user={user} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </ScrollLayout>
  );
}
