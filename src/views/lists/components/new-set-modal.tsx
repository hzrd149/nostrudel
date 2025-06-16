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
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { useForm } from "react-hook-form";

import { usePublishEvent } from "../../../providers/global/publish-provider";

export type NewSetModalProps = Omit<ModalProps, "children"> & {
  onCreated?: (list: NostrEvent) => void;
  initKind?: number;
  allowSelectKind?: boolean;
};

export default function NewBookmarkSetModal({
  onClose,
  onCreated,
  initKind,
  allowSelectKind = true,
  ...props
}: NewSetModalProps) {
  const publish = usePublishEvent();
  const { handleSubmit, register, formState } = useForm({
    defaultValues: {
      kind: initKind || kinds.Followsets,
      name: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const draft: EventTemplate = {
      content: "",
      created_at: dayjs().unix(),
      tags: [
        ["d", nanoid()],
        ["title", values.name],
      ],
      kind: values.kind,
    };
    const pub = await publish("Create list", draft);

    if (pub && onCreated) onCreated(pub.event);
  });

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" pb="0">
          New List
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody as="form" px="4" pt="0" display="flex" gap="2" flexDirection="column" onSubmit={submit}>
          {allowSelectKind && (
            <FormControl isRequired>
              <FormLabel>List kind</FormLabel>
              <Select {...register("kind", { valueAsNumber: true, required: true })}>
                <option value={kinds.Followsets}>People List</option>
                <option value={kinds.Genericlists}>Generic List</option>
                <option value={kinds.Bookmarksets}>Bookmark set</option>
              </Select>
            </FormControl>
          )}
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              type="text"
              {...register("name", { required: true })}
              autoComplete="off"
              placeholder="List name"
              autoFocus
            />
          </FormControl>
          <ButtonGroup ml="auto">
            <Button onClick={onClose}>Cancel</Button>
            <Button colorScheme="primary" type="submit" isLoading={formState.isSubmitting}>
              Create
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
