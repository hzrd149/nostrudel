import {
  Flex,
  FlexProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Tag,
  TagLabel,
  TagProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import NostrPublishAction from "../classes/nostr-publish-action";
import useSubject from "../hooks/use-subject";
import { CheckIcon, ErrorIcon } from "./icons";
import { publishLog } from "../services/publish-log";
import { PublishDetails } from "./publish-details";

export function PublishActionStatusTag({ pub, ...props }: { pub: NostrPublishAction } & Omit<TagProps, "children">) {
  const results = useSubject(pub.results);

  const successful = results.filter((result) => result.status);
  const failedWithMessage = results.filter((result) => !result.status && result.message);

  let statusIcon = <Spinner size="xs" />;
  let statusColor: TagProps["colorScheme"] = "blue";
  if (results.length !== pub.relays.length) {
    statusColor = "blue";
    statusIcon = <Spinner size="xs" />;
  } else if (successful.length === 0) {
    statusColor = "red";
    statusIcon = <ErrorIcon />;
  } else if (failedWithMessage.length > 0) {
    statusColor = "orange";
    statusIcon = <CheckIcon />;
  } else {
    statusColor = "green";
    statusIcon = <CheckIcon />;
  }

  return (
    <Tag colorScheme={statusColor} {...props}>
      <TagLabel mr="1">
        {successful.length}/{pub.relays.length}
      </TagLabel>
      {statusIcon}
    </Tag>
  );
}

function PublishAction({ pub }: { pub: NostrPublishAction }) {
  const details = useDisclosure();

  return (
    <>
      <Flex gap="2" alignItems="center" cursor="pointer" onClick={details.onOpen}>
        <Text>{pub.label}</Text>
        <PublishActionStatusTag ml="auto" pub={pub} />
      </Flex>
      {details.isOpen && (
        <Modal isOpen onClose={details.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader pt="4" px="4" pb="0">
              {pub.label}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p="2">
              <PublishDetails pub={pub} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default function PublishLog({ ...props }: Omit<FlexProps, "children">) {
  const log = Array.from(useSubject(publishLog)).reverse();

  return (
    <Flex overflow="hidden" direction="column" gap="1" {...props}>
      {log.length > 0 && <Text>Activity log:</Text>}
      {log.map((pub) => (
        <PublishAction key={pub.id} pub={pub} />
      ))}
    </Flex>
  );
}
