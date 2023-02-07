import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalProps,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  useForceUpdate,
} from "@chakra-ui/react";
import { useAsync, useInterval } from "react-use";
import db from "../services/db";

export const DevModel = (props: Omit<ModalProps, "children">) => {
  const update = useForceUpdate();
  useInterval(update, 1000 * 5);

  const { value: eventsSeen } = useAsync(() => db.count("events-seen"), []);
  const { value: usersSeen } = useAsync(() => db.count("user-metadata"), []);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Stats</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <StatGroup>
            <Stat>
              <StatLabel>Events Seen</StatLabel>
              <StatNumber>{eventsSeen ?? "loading..."}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Users Seen</StatLabel>
              <StatNumber>{usersSeen ?? "loading..."}</StatNumber>
            </Stat>
          </StatGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
