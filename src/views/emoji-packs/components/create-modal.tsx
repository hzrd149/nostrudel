import {
  Button,
  FormControl,
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
  useToast,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { EMOJI_PACK_KIND } from "../../../helpers/nostr/emoji-packs";
import { DraftNostrEvent } from "../../../types/nostr-event";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import relayHintService from "../../../services/event-relay-hint";

export default function EmojiPackCreateModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const publish = usePublishEvent();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const draft: DraftNostrEvent = {
      kind: EMOJI_PACK_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [["d", values.title]],
    };

    const pub = await publish("Create emoji pack", draft);
    if (pub) navigate(`/emojis/${relayHintService.getSharableEventAddress(pub.event)}`);
  });

  return (
    <Modal onClose={onClose} size="xl" {...props}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={submit}>
        <ModalHeader p="4">Create Emoji pack</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          <FormControl isRequired>
            <FormLabel>Pack name</FormLabel>
            <Input type="name" {...register("title", { required: true })} autoComplete="off" />
          </FormControl>
        </ModalBody>

        <ModalFooter p="4">
          <Button mr="2" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="primary" type="submit">
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
