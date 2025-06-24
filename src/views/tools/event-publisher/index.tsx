import {
  Button,
  ButtonGroup,
  Code,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Switch,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { NostrEvent, UnsignedEvent, verifyEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import { useActiveAccount } from "applesauce-react/hooks";
import { EditIcon, WritingIcon } from "../../../components/icons";
import Play from "../../../components/icons/play";
import SimpleView from "../../../components/layout/presets/simple-view";
import { RelayUrlInput } from "../../../components/relay-url-input";
import RequireActiveAccount from "../../../components/router/require-active-account";
import UserAvatar from "../../../components/user/user-avatar";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import EventTemplateEditor from "./components/event-template-editor";
import EventJsonEditor from "./components/json-editor";
import VariableEditor from "./components/variable-editor";
import { getVariables, LooseEventTemplate, processEvent, Variable } from "./process";
import { TEMPLATES } from "./templates";

function EventPublisherPage({ initDraft }: { initDraft?: LooseEventTemplate }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const customRelay = useDisclosure();

  const editor = useDisclosure({ defaultIsOpen: true });
  const editRaw = useDisclosure();

  const [customRelayURL, setCustomRelayURL] = useState("");

  const [variables, setVariables] = useState<Variable[]>(initDraft ? [] : TEMPLATES[0].variables);
  const [draft, setDraft] = useState<LooseEventTemplate>(initDraft || TEMPLATES[0].template());
  const [finalized, setFinalized] = useState<UnsignedEvent>();

  // update the variables based on the template
  useEffect(() => {
    if (draft) {
      const variableNames = getVariables(draft);

      setVariables((current) => {
        return variableNames.map((name) => {
          return current.find((v) => v.name === name) || { type: "string", value: "", name };
        });
      });
    }
  }, [draft]);

  const [processed, setProcessed] = useState<UnsignedEvent>();
  useEffect(() => {
    try {
      if (!draft) return;
      setProcessed(processEvent(draft, variables, account));
    } catch (error) {}
  }, [draft, account, variables]);

  const submitEvent = () => {
    try {
      const event = processEvent(draft, variables, account);
      setFinalized(event);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const sign = async () => {
    if (!finalized) return;
    try {
      setFinalized(await account.signEvent(finalized));
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  const publishDraft = async () => {
    if (!finalized || !(finalized as NostrEvent).sig) return;
    try {
      setLoading(true);
      let event: NostrEvent;

      if ((finalized as NostrEvent).sig) event = finalized as NostrEvent;
      else event = await account.signEvent(processEvent(finalized, variables, account));

      const valid = verifyEvent(event);
      if (!valid) throw new Error("Invalid event");
      if (customRelayURL) {
        await publish("Custom Event", finalized, [customRelayURL], true, true);
      } else {
        await publish("Custom Event", finalized);
      }
      setFinalized(undefined);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  const selectTemplate = (name: string) => {
    const template = TEMPLATES.find((t) => t.name === name);
    if (template) {
      setVariables(template.variables);
      setDraft(template.template());
      if (template.variables.length > 0) editor.onClose();
      else editor.onOpen();
    }
  };

  return (
    <SimpleView title="Event Publisher">
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Switch size="sm" isChecked={customRelay.isOpen} onChange={customRelay.onToggle}>
          Publish to Relay
        </Switch>
        {customRelay.isOpen && (
          <RelayUrlInput
            borderRadius="md"
            w="xs"
            value={customRelayURL}
            onChange={(e) => setCustomRelayURL(e.target.value)}
          />
        )}
        <ButtonGroup ml="auto">
          <Button colorScheme="primary" onClick={submitEvent} leftIcon={<Play />}>
            Publish
          </Button>
        </ButtonGroup>
      </Flex>

      <Flex direction={{ base: "column", xl: "row" }} gap="2">
        <Flex direction="column" gap="2" flex={1} overflow="hidden">
          <Flex gap="2" alignItems="center">
            <Text fontWeight="bold">Template</Text>
            <Select onChange={(e) => selectTemplate(e.target.value)} w="auto">
              {TEMPLATES.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </Select>
            <Spacer />
            <ButtonGroup size="sm">
              {editor.isOpen && (
                <Button onClick={editRaw.onToggle} colorScheme={editRaw.isOpen ? "primary" : undefined}>
                  Raw
                </Button>
              )}
              <Button
                onClick={editor.onToggle}
                colorScheme={editor.isOpen ? "primary" : undefined}
                leftIcon={<EditIcon />}
              >
                Edit
              </Button>
            </ButtonGroup>
          </Flex>

          {editor.isOpen &&
            (editRaw.isOpen ? (
              <EventJsonEditor draft={draft} onChange={setDraft} onRun={submitEvent} />
            ) : (
              <EventTemplateEditor draft={draft} onChange={setDraft} />
            ))}

          <Flex gap="2">
            <Heading size="md" mt="4">
              Variables
            </Heading>
          </Flex>
          <VariableEditor variables={variables} onChange={(v) => setVariables(v)} />
        </Flex>

        <Divider hideFrom="xl" />

        <Flex flex={1} direction="column" gap="2" overflow="hidden">
          <Code whiteSpace="pre" overflow="auto" p="2">
            {JSON.stringify(processed, null, 2)}
          </Code>
        </Flex>
      </Flex>

      {finalized && (
        <Modal isOpen onClose={() => setFinalized(undefined)} size="2xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Publish Event</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pb="2" pt="0">
              <Heading size="md" mt="2">
                1. Event ID
              </Heading>
              <Code w="full" p="2" overflow="auto">
                {(finalized as NostrEvent).id}
              </Code>
              <Heading size="md" mt="2">
                2. Pubkey
              </Heading>
              <Flex gap="2" alignItems="center">
                <Code w="full" p="2" overflow="auto">
                  {(finalized as NostrEvent).pubkey}
                </Code>
                <UserAvatar pubkey={(finalized as NostrEvent).pubkey} />
              </Flex>
              <Heading size="md" whiteSpace="pre" mt="2">
                3. Signature
              </Heading>
              <Flex gap="2" alignItems="center">
                <Code overflow="auto" whiteSpace="pre" w="full" p="2">
                  {(finalized as NostrEvent).sig}
                </Code>
                <Button leftIcon={<WritingIcon boxSize={5} />} flexShrink={0} onClick={sign} ml="auto">
                  Sign
                </Button>
              </Flex>

              {(finalized as NostrEvent).sig && (
                <Button w="full" colorScheme="primary" mt="2" isLoading={loading} onClick={publishDraft}>
                  Publish
                </Button>
              )}
            </ModalBody>

            <ModalFooter>
              <Button mr={2} onClick={() => setFinalized(undefined)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </SimpleView>
  );
}

export default function EventPublisherView() {
  let { value: draft } = useRouteStateValue<NostrEvent>("draft");

  if (draft && draft.sig) {
    draft = { ...draft };
    // @ts-ignore
    delete draft.sig;
  }

  return (
    <RequireActiveAccount>
      <EventPublisherPage initDraft={draft} />
    </RequireActiveAccount>
  );
}
