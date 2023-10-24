import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  Image,
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
  useToast,
} from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";
import { UploadImageIcon } from "../../../components/icons";
import Upload01 from "../../../components/icons/upload-01";
import Upload02 from "../../../components/icons/upload-02";
import { useCallback, useState } from "react";
import { nostrBuildUploadImage } from "../../../helpers/nostr-build";
import { useSigningContext } from "../../../providers/signing-provider";

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
  const toast = useToast();
  const account = useCurrentAccount();
  const { requestSignature } = useSigningContext();

  const {
    register,
    formState: { errors, isSubmitting },
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
  watch("banner");

  const [uploading, setUploading] = useState(false);
  const uploadFile = useCallback(
    async (file: File) => {
      try {
        if (!(file.type.includes("image") || file.type.includes("video") || file.type.includes("audio")))
          throw new Error("Unsupported file type");

        setUploading(true);

        const response = await nostrBuildUploadImage(file, requestSignature);
        const imageUrl = response.url;
        setValue("banner", imageUrl, { shouldDirty: true, shouldValidate: true });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [setValue, getValues, requestSignature, toast],
  );

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
                placeholder="more-cat-pictures"
              />
              <FormHelperText>The name of your community (no-spaces)</FormHelperText>
              {errors.name?.message && <FormErrorMessage>{errors.name?.message}</FormErrorMessage>}
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea {...register("description")} autoComplete="off" />
            <FormHelperText>Short description about your community</FormHelperText>
            {errors.description?.message && <FormErrorMessage>{errors.description?.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.banner}>
            <FormLabel>Banner</FormLabel>
            {getValues().banner && (
              <Box
                backgroundImage={getValues().banner}
                backgroundRepeat="no-repeat"
                backgroundPosition="center"
                backgroundSize="cover"
                aspectRatio={3 / 1}
                mb="2"
                borderRadius="lg"
              />
            )}
            <Flex gap="2">
              <Input
                type="url"
                {...register("banner")}
                autoComplete="off"
                placeholder="https://example.com/banner.png"
              />
              <Input
                id="banner-upload"
                type="file"
                accept="image/*"
                display="none"
                onChange={(e) => {
                  const img = e.target.files?.[0];
                  if (img) uploadFile(img);
                }}
              />
              <IconButton
                as="label"
                htmlFor="banner-upload"
                icon={<Upload01 />}
                aria-label="Upload Image"
                cursor="pointer"
                tabIndex={0}
                isLoading={uploading}
              />
            </Flex>
            {errors.banner?.message && <FormErrorMessage>{errors.banner?.message}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.rules}>
            <FormLabel>Rules and Guidelines</FormLabel>
            <Textarea {...register("rules")} autoComplete="off" placeholder="don't be a jerk" />
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
          <Button colorScheme="primary" type="submit" isLoading={isSubmitting}>
            {isUpdate ? "Update Community" : "Create Community"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
