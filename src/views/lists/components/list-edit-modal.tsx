import {
  AspectRatio,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Textarea,
  VisuallyHiddenInput,
} from "@chakra-ui/react";
import { UpdateFollowSetInformation } from "applesauce-actions/actions";
import { getReplaceableIdentifier, getTagValue } from "applesauce-core/helpers";
import { useActionHub } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useRef } from "react";
import { useForm } from "react-hook-form";

import { getListDescription, getListTitle } from "../../../helpers/nostr/lists";
import { useInputUploadFileWithForm } from "../../../hooks/use-input-upload-file";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { OutboxIcon } from "../../../components/icons";
import ImageURLInput from "../../../components/form/image-input";

type FormData = {
  title: string;
  description: string;
  image: string;
};

type ListEditModalProps = Omit<ModalProps, "children"> & {
  list: NostrEvent;
};

export default function ListEditModal({ list, onClose, ...props }: ListEditModalProps) {
  const actions = useActionHub();
  const publish = usePublishEvent();

  const { handleSubmit, register, watch, setValue } = useForm<FormData>({
    defaultValues: {
      title: getListTitle(list),
      description: getListDescription(list) || "",
      image: getTagValue(list, "image") || "",
    },
  });

  const imageUrl = watch("image");

  const onSubmit = handleSubmit(async (data) => {
    const identifier = getReplaceableIdentifier(list);
    await actions
      .exec(UpdateFollowSetInformation, identifier, {
        title: data.title,
        description: data.description,
        image: data.image,
      })
      .forEach((e) => publish("Update list", e));
    onClose();
  });

  return (
    <Modal onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit List</ModalHeader>
        <ModalCloseButton />
        <ModalBody as="form" onSubmit={onSubmit} pb={6}>
          <FormControl mb={4}>
            <FormLabel>Title</FormLabel>
            <Input {...register("title")} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea {...register("description")} />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Image URL</FormLabel>
            <ImageURLInput value={imageUrl} onChange={(v) => setValue("image", v)} />
          </FormControl>

          {imageUrl && (
            <FormControl mb={4}>
              <FormLabel>Image Preview</FormLabel>
              <AspectRatio ratio={3 / 1} maxH="md" mx="auto">
                <Image src={imageUrl} alt="List image banner preview" objectFit="cover" />
              </AspectRatio>
            </FormControl>
          )}

          <ButtonGroup justifyContent="flex-end" w="full">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="primary">
              Save Changes
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
