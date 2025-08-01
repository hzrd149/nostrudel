import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react";

import useParamsProfilePointer from "../../../../hooks/use-params-pubkey-pointer";
import useRouteStateValue from "../../../../hooks/use-route-state-value";
import UserLayout from "../../components/layout";
import MailboxSection from "./mailboxes";
import ProfileSection from "./profile";
import BlossomServersSection from "./blossom";
import NIP05DebugSection from "./nip-05";

export default function UserAdvancedTab() {
  const user = useParamsProfilePointer("pubkey");
  const section = useRouteStateValue<number | number[]>("section", 0);

  return (
    <UserLayout maxW="6xl" center flush>
      <Accordion index={section.value} onChange={(v) => section.setValue(v)}>
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
    </UserLayout>
  );
}
