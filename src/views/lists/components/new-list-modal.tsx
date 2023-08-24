import { useForm } from "react-hook-form";
import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../../helpers/nostr/lists";
import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";

export type NewListModalProps = { onCreated?: (list: NostrEvent) => void } & Omit<ModalProps, "children">;

export default function NewListModal({ onClose, onCreated, ...props }: NewListModalProps) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const { handleSubmit, register, formState } = useForm({
    defaultValues: {
      kind: PEOPLE_LIST_KIND,
      name: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const draft: DraftNostrEvent = {
        content: "",
        created_at: dayjs().unix(),
        tags: [["d", values.name]],
        kind: values.kind,
      };
      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction("Create list", clientRelaysService.getWriteUrls(), signed);

      if (onCreated) onCreated(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">New List</ModalHeader>
        <ModalCloseButton />
        <ModalBody as="form" p="4" display="flex" gap="2" flexDirection="column" onSubmit={submit}>
          <FormControl isRequired>
            <FormLabel>List kind</FormLabel>
            <Select {...register("kind", { valueAsNumber: true, required: true })}>
              <option value={PEOPLE_LIST_KIND}>People List</option>
              <option value={NOTE_LIST_KIND}>Note List</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input type="text" {...register("name", { required: true })} autoComplete="off" />
          </FormControl>
          <ButtonGroup ml="auto">
            <Button onClick={onClose}>Cancel</Button>
            <Button colorScheme="brand" type="submit" isLoading={formState.isSubmitting}>
              Create
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
