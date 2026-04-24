import { InfoIcon } from "@chakra-ui/icons";
import {
  ComponentWithAs,
  HStack,
  IconProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { ComponentType } from "react";

import { getSharableEventAddress } from "../../services/relay-hints";
import { AtIcon, CodeIcon, RelayIcon, ReplyIcon } from "../icons";
import PenTool01 from "../icons/pen-tool-01";
import DebugContentPage from "./pages/content";
import DebugEventPointersPage from "./pages/pointers";
import RawJsonPage from "./pages/raw";
import DebugEventReferencesPage from "./pages/references";
import DebugEventRelaysPage from "./pages/relays";
import RawValue from "./raw-value";

type DebugTool = {
  id: string;
  name: string;
  icon: ComponentWithAs<"svg", IconProps>;
  component: ComponentType<{ event: NostrEvent }>;
};

const tools: DebugTool[] = [
  { id: "content", name: "Content", icon: PenTool01, component: DebugContentPage },
  { id: "pointers", name: "Pointers", icon: AtIcon, component: DebugEventPointersPage },
  { id: "references", name: "References", icon: ReplyIcon, component: DebugEventReferencesPage },
  { id: "json", name: "JSON", icon: CodeIcon, component: RawJsonPage },
  { id: "relays", name: "Relays", icon: RelayIcon, component: DebugEventRelaysPage },
];

export default function EventDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  return (
    <Modal size="6xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody px="4" pt="0" pb="4" display="flex" flexDirection="column" gap="2">
          <Tabs isFitted isLazy mt="2">
            <TabList mb="1em">
              <Tab>
                <HStack spacing="2">
                  <InfoIcon boxSize="4" />
                  <Text>Overview</Text>
                </HStack>
              </Tab>
              {tools.map(({ icon: Icon, name, id }) => (
                <Tab key={id}>
                  <HStack spacing="2">
                    <Icon boxSize="4" />
                    <Text>{name}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              <TabPanel p="0" display="flex" flexDirection="column" gap="2">
                <RawValue heading="Event Id" value={event.id} />
                <RawValue heading="NIP-19 Encoded Id" value={nip19.noteEncode(event.id)} />
                <RawValue heading="NIP-19 Pointer" value={getSharableEventAddress(event)} />
              </TabPanel>
              {tools.map(({ id, component: Page }) => (
                <TabPanel key={id} p="0">
                  <Page event={event} />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
