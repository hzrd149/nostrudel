import {
  Button,
  ComponentWithAs,
  Flex,
  IconButton,
  IconProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { ComponentType, useState } from "react";

import { getSharableEventAddress } from "../../services/relay-hints";
import { CodeIcon, RelayIcon, ThreadIcon } from "../icons";
import Database01 from "../icons/database-01";
import PenTool01 from "../icons/pen-tool-01";
import Tag01 from "../icons/tag-01";
import DebugEventCachePage from "./pages/cache";
import DebugContentPage from "./pages/content";
import RawJsonPage from "./pages/raw";
import DebugEventRelaysPage from "./pages/relays";
import DebugTagsPage from "./pages/tags";
import DebugThreadingPage from "./pages/threading";
import RawValue from "./raw-value";

type DebugTool = {
  id: string;
  name: string;
  icon: ComponentWithAs<"svg", IconProps>;
  component: ComponentType<{ event: NostrEvent }>;
};

const tools: DebugTool[] = [
  { id: "content", name: "Content", icon: PenTool01, component: DebugContentPage },
  { id: "json", name: "JSON", icon: CodeIcon, component: RawJsonPage },
  { id: "threading", name: "Threading", icon: ThreadIcon, component: DebugThreadingPage },
  { id: "tags", name: "Tags", icon: Tag01, component: DebugTagsPage },
  { id: "relays", name: "Relays", icon: RelayIcon, component: DebugEventRelaysPage },
  { id: "cache", name: "Cache", icon: Database01, component: DebugEventCachePage },
];

function DefaultPage({ event, setSelected }: { setSelected: (id: string) => void; event: NostrEvent }) {
  return (
    <>
      <RawValue heading="Event Id" value={event.id} />
      <RawValue heading="NIP-19 Encoded Id" value={nip19.noteEncode(event.id)} />
      <RawValue heading="NIP-19 Pointer" value={getSharableEventAddress(event)} />
      <Flex gap="2" flexWrap="wrap">
        {tools.map(({ icon: Icon, name, id }) => (
          <Button
            variant="outline"
            key={id}
            leftIcon={<Icon boxSize={10} mb="4" />}
            onClick={() => setSelected(id)}
            h="36"
            w="36"
            flexDirection="column"
          >
            {name}
          </Button>
        ))}
      </Flex>
    </>
  );
}

export default function EventDebugModal({ event, ...props }: { event: NostrEvent } & Omit<ModalProps, "children">) {
  const [selected, setSelected] = useState("");

  const tool = tools.find((t) => t.id === selected);
  const Page = tool?.component;
  const IconComponent = tool?.icon;

  return (
    <Modal size="6xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" pt="4" pb="2" display="flex" alignItems="center" gap="2">
          {tool && IconComponent && (
            <IconButton icon={<IconComponent boxSize={6} />} aria-label="Select Tool" onClick={() => setSelected("")} />
          )}
          <Text as="span">{tool?.name || event.id}</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4" display="flex" flexDirection="column" gap="2">
          {Page ? <Page event={event} /> : <DefaultPage setSelected={setSelected} event={event} />}

          {tool && (
            <Button aria-label="Back" onClick={() => setSelected("")}>
              Back
            </Button>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
