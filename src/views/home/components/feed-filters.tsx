import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Switch,
} from "@chakra-ui/react";
import { useState } from "react";
import { useList } from "react-use";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { unique } from "../../../helpers/array";
import useSubject from "../../../hooks/use-subject";
import settings from "../../../services/settings";

const CustomRelayForm = ({ onSubmit }: { onSubmit: (url: string) => void }) => {
  const [customRelay, setCustomRelay] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(customRelay);
        setCustomRelay("");
      }}
    >
      <Flex gap="2">
        <RelayUrlInput
          size="sm"
          placeholder="wss://relay.example.com"
          value={customRelay}
          onChange={(e) => setCustomRelay(e.target.value)}
        />
        <Button size="sm" type="submit">
          Add
        </Button>
      </Flex>
    </form>
  );
};

export type FilterValues = {
  relays: string[];
};

export type FeedFiltersProps = {
  isOpen: boolean;
  onClose: ModalProps["onClose"];
  values: FilterValues;
  onSave: (values: FilterValues) => void;
};

export const FeedFilters = ({ isOpen, onClose, values }: FeedFiltersProps) => {
  const defaultRelays = useSubject(settings.relays);

  const [selectedRelays, relayActions] = useList(values.relays);
  const availableRelays = unique([...defaultRelays, ...selectedRelays]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Filters</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Accordion allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Relays
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                {availableRelays.map((url) => (
                  <Box key={url}>
                    <FormLabel>
                      <Switch
                        size="sm"
                        mr="2"
                        isChecked={selectedRelays.includes(url)}
                        onChange={() =>
                          selectedRelays.includes(url)
                            ? relayActions.removeAt(selectedRelays.indexOf(url))
                            : relayActions.push(url)
                        }
                      />
                      {url}
                    </FormLabel>
                  </Box>
                ))}
                <Flex gap="2">
                  <Button size="sm" onClick={() => relayActions.set(defaultRelays)}>
                    Select All
                  </Button>
                  <CustomRelayForm onSubmit={(url) => relayActions.push(url)} />
                </Flex>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Add Custom
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" variant="solid">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
