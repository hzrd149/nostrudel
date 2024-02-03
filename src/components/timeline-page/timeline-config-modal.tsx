import {
  Divider,
  Flex,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { NotesIcon, SettingsIcon } from "../icons";
import { KindNames } from "../../helpers/nostr/kinds";
import { useKindSelectionContext } from "../../providers/local/kind-selection-provider";

function KindToggle({ kind }: { kind: number }) {
  const { kinds, toggleKind } = useKindSelectionContext();
  const name = KindNames[kind];

  return (
    <Flex gap="2" alignItems="center">
      <IconButton
        icon={<NotesIcon />}
        aria-label={"Toggle " + name}
        title={"Toggle " + name}
        onClick={() => toggleKind(kind)}
        variant="outline"
        colorScheme={kinds.includes(kind) ? "primary" : undefined}
      />
      <Text fontWeight="bold">{name}</Text>
    </Flex>
  );
}

export function TimelineConfigButton({ availableKinds }: { availableKinds?: number[] }) {
  const modal = useDisclosure();

  return (
    <>
      <IconButton
        icon={<SettingsIcon boxSize={5} />}
        aria-label="Feed Options"
        title="Feed Options"
        onClick={modal.onOpen}
      />
      {modal.isOpen && <TimelineConfigModal availableKinds={availableKinds} isOpen onClose={modal.onClose} />}
    </>
  );
}

export default function TimelineConfigModal({
  onClose,
  availableKinds,
  ...props
}: Omit<ModalProps, "children"> & { availableKinds?: number[] }) {
  return (
    <Modal onClose={onClose} size="4xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Feed Options</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" px="4" pt="0" pb="4" gap="2" flexDirection="column">
          <Heading size="md">Kinds</Heading>
          <Divider />
          <Flex gap="4" wrap="wrap" alignItems="center">
            {availableKinds?.map((kind) => <KindToggle key={kind} kind={kind} />)}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
