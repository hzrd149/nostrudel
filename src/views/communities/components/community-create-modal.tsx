import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
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
  Radio,
  RadioGroup,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";

export type FormValues = {
  name: string;
  banner: string;
  description: string;
  rules: string;
  mods: string[];
  relays: string[];
  ranking: string;
};

export default function CommunityCreateModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  isUpdate,
  ...props
}: Omit<ModalProps, "children"> & {
  onSubmit: SubmitHandler<FormValues>;
  defaultValues?: FormValues;
  isUpdate?: boolean;
}) {
  const account = useCurrentAccount();

  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    getValues,
    setValue,
  } = useForm<FormValues>({
    mode: "all",
    defaultValues: defaultValues || {
      name: "",
      banner: "",
      description: "",
      rules: "",
      mods: account ? [account.pubkey] : [],
      relays: [],
      ranking: "votes",
    },
  });

  watch("mods");
  watch("ranking");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader p="4">{isUpdate ? "Update Community" : "Create Community"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0" gap="4" display="flex" flexDirection="column">
          {!isUpdate && (
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Community Name</FormLabel>
              <Input
                type="text"
                {...register("name", {
                  required: true,
                  validate: (v) => {
                    if (/\p{Z}/iu.test(v)) return "Must not have spaces";
                    return true;
                  },
                })}
                isReadOnly={isUpdate}
                autoComplete="off"
              />
              <FormHelperText>The name of your community (no-spaces)</FormHelperText>
              {errors.name?.message && <FormErrorMessage>{errors.name?.message}</FormErrorMessage>}
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea {...register("description")} autoComplete="off" />
            <FormHelperText>short description about your community</FormHelperText>
            {errors.description?.message && <FormErrorMessage>{errors.description?.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.rules}>
            <FormLabel>Rules and Guidelines</FormLabel>
            <Textarea {...register("rules")} autoComplete="off" />
            <FormHelperText>Rules and posting guidelines</FormHelperText>
            {errors.rules?.message && <FormErrorMessage>{errors.rules?.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.mods}>
            <FormLabel>Moderators</FormLabel>
            {getValues().mods.map((pubkey) => (
              <Flex gap="2" alignItems="center" key={pubkey}>
                <UserAvatar pubkey={pubkey} size="sm" />
                <UserLink pubkey={pubkey} fontWeight="bold" />
              </Flex>
            ))}
          </FormControl>

          <FormControl isInvalid={!!errors.mods}>
            <FormLabel>Default Raking</FormLabel>
            <RadioGroup
              value={getValues().ranking}
              onChange={(e) => setValue("ranking", e, { shouldDirty: true, shouldTouch: true })}
            >
              <Stack direction="row">
                <Radio value="votes">Votes</Radio>
                <Radio value="zaps">Zaps</Radio>
              </Stack>
            </RadioGroup>
            <FormHelperText>The default by posts are ranked when viewing the community</FormHelperText>
            {errors.rules?.message && <FormErrorMessage>{errors.rules?.message}</FormErrorMessage>}
          </FormControl>
        </ModalBody>

        <ModalFooter p="4" display="flex" gap="2">
          <Button onClick={onClose}>Cancel</Button>
          <Button colorScheme="primary" type="submit">
            {isUpdate ? "Update Community" : "Create Community"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
