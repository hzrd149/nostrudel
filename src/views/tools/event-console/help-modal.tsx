import {
  Code,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/react";

export default function HelpModal({ isOpen, onClose, ...props }: Omit<ModalProps, "children">) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Help</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4">
          <Heading size="sm">Keyboard shortcuts</Heading>
          <Text>
            <Code>Ctrl+Shift+Enter</Code>: Run Filter
          </Text>

          <Heading size="sm" mt="4">
            Pubkeys
          </Heading>
          <Text>
            Typing <Code>@</Code> inside any string will autocomplete with a list of users the app has seen
          </Text>

          <Heading size="sm" mt="4">
            Dates
          </Heading>
          <Text>
            <Code>since</Code> and <Code>until</Code> fields can both take relative times in the form of strings
          </Text>
          <Text>Examples:</Text>
          <Flex gap="1">
            {["now", "n-3h", "n-5", "n+4m", "n-7d", "n-30s", "n-4w"].map((t) => (
              <Code key={t}>{t}</Code>
            ))}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
