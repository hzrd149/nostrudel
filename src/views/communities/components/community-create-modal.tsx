import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  IconButtonProps,
  Input,
  Link,
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
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";

import useCurrentAccount from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user-avatar";
import UserLink from "../../../components/user-link";
import { TrashIcon } from "../../../components/icons";
import Upload01 from "../../../components/icons/upload-01";
import { nostrBuildUploadImage } from "../../../helpers/nostr-build";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { safeRelayUrl } from "../../../helpers/url";
import { RelayFavicon } from "../../../components/relay-favicon";
import NpubAutocomplete from "../../../components/npub-autocomplete";
import { normalizeToHexPubkey } from "../../../helpers/nip19";
import { safeUrl } from "../../../helpers/parse";

function RemoveButton({ ...props }: IconButtonProps) {
  return <IconButton icon={<TrashIcon />} size="sm" colorScheme="red" variant="ghost" ml="auto" {...props} />;
}

export type FormValues = {
  name: string;
  banner: string;
  description: string;
  rules: string;
  mods: string[];
  relays: string[];
  links: ([string] | [string, string])[];
  // ranking: string;
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
      links: [],
      // ranking: "votes",
    },
  });

  watch("mods");
  // watch("ranking");
  watch("banner");
  watch("links");
  watch("relays");

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

  const [modInput, setModInput] = useState("");
  const addMod = () => {
    if (!modInput) return;
    const pubkey = normalizeToHexPubkey(modInput);
    if (pubkey) {
      setValue("mods", getValues("mods").concat(pubkey));
    }
    setModInput("");
  };
  const removeMod = (pubkey: string) => {
    setValue(
      "mods",
      getValues("mods").filter((p) => p !== pubkey),
    );
  };

  const [relayInput, setRelayInput] = useState("");
  const addRelay = () => {
    if (!relayInput) return;
    const url = safeRelayUrl(relayInput);
    if (url) {
      setValue("relays", getValues("relays").concat(url));
    }
    setRelayInput("");
  };
  const removeRelay = (url: string) => {
    setValue(
      "relays",
      getValues("relays").filter((r) => r !== url),
    );
  };

  const [linkInput, setLinkInput] = useState("");
  const [linkName, setLinkName] = useState("");
  const addLink = () => {
    if (!linkInput) return;
    const url = safeUrl(linkInput);
    if (url) {
      setValue("links", [...getValues("links"), linkName ? [url, linkName] : [url]]);
    }
    setLinkInput("");
    setLinkName("");
  };
  const removeLink = (url: string) => {
    setValue(
      "links",
      getValues("links").filter(([r]) => r !== url),
    );
  };

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
            <Flex direction="column" gap="2" pb="2">
              {getValues().mods.map((pubkey) => (
                <Flex gap="2" alignItems="center" key={pubkey}>
                  <UserAvatar pubkey={pubkey} size="sm" />
                  <UserLink pubkey={pubkey} fontWeight="bold" />
                  <RemoveButton
                    aria-label={`Remove moderator`}
                    title={`Remove moderator`}
                    onClick={() => removeMod(pubkey)}
                  />
                </Flex>
              ))}
            </Flex>
            <Flex gap="2">
              <NpubAutocomplete value={modInput} onChange={(e) => setModInput(e.target.value)} />
              <Button isDisabled={!modInput} onClick={addMod}>
                Add
              </Button>
            </Flex>
          </FormControl>

          {/* <FormControl isInvalid={!!errors.mods}>
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
            <FormHelperText>The default way posts are ranked when viewing the community</FormHelperText>
            {errors.ranking?.message && <FormErrorMessage>{errors.ranking?.message}</FormErrorMessage>}
          </FormControl> */}

          <FormControl isInvalid={!!errors.mods}>
            <FormLabel>Relays</FormLabel>
            <FormHelperText>A Short list of recommended relays for the community</FormHelperText>
            <Flex direction="column" gap="2" py="2">
              {getValues().relays.map((url) => (
                <Flex key={url} alignItems="center" gap="2">
                  <RelayFavicon relay={url} size="sm" />
                  <Text fontWeight="bold" isTruncated>
                    {url}
                  </Text>
                  <RemoveButton aria-label={`Remove ${url}`} title={`Remove ${url}`} onClick={() => removeRelay(url)} />
                </Flex>
              ))}
            </Flex>
            <Flex gap="2">
              <RelayUrlInput value={relayInput} onChange={(v) => setRelayInput(v)} />
              <Button isDisabled={!relayInput} onClick={addRelay}>
                Add
              </Button>
            </Flex>
          </FormControl>

          <FormControl isInvalid={!!errors.mods}>
            <FormLabel>Links</FormLabel>
            <FormHelperText>A few helpful resources for the community</FormHelperText>
            <Flex direction="column" mt="2">
              {getValues().links.map(([link, name]) => (
                <Flex key={link}>
                  <Link href={link}>{name || link}</Link>
                  <RemoveButton aria-label="Remove Link" title="Remove Link" onClick={() => removeLink(link)} />
                </Flex>
              ))}
            </Flex>
            <Flex gap="2">
              <Input
                type="url"
                placeholder="https://example.com/useful-resources.html"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <Input placeholder="title" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
              <Button isDisabled={!linkInput} onClick={addLink} flexShrink={0}>
                Add
              </Button>
            </Flex>
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
