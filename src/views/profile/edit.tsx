import {
  Avatar,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Textarea,
  VisuallyHiddenInput,
} from "@chakra-ui/react";
import { parseNIP05Address, ProfileContent, unixNow } from "applesauce-core/helpers";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { useActiveAccount } from "applesauce-react/hooks";
import { EventTemplate } from "nostr-tools";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";

import { ExternalLinkIcon, OutboxIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { DEFAULT_LOOKUP_RELAYS } from "../../const";
import { isLNURL } from "../../helpers/lnurl";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useInputUploadFileWithForm } from "../../hooks/use-input-upload-file";
import useUserProfile from "../../hooks/use-user-profile";
import { usePublishEvent } from "../../providers/global/publish-provider";
import dnsIdentityLoader from "../../services/dns-identity-loader";
import lnurlMetadataService from "../../services/lnurl-metadata";

const isEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function isLightningAddress(addr: string) {
  return isEmail.test(addr);
}

type FormData = {
  displayName?: string;
  username?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lightningAddress?: string;
};

type MetadataFormProps = {
  defaultValues?: FormData;
  onSubmit: (data: FormData) => void;
};

const MetadataForm = ({ defaultValues, onSubmit }: MetadataFormProps) => {
  const account = useActiveAccount()!;
  const {
    register,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const pictureUploadManage = useInputUploadFileWithForm(setValue, "picture");
  const pictureUploadRef = useRef<HTMLInputElement | null>(null);

  const bannerUploadManage = useInputUploadFileWithForm(setValue, "banner");
  const bannerUploadRef = useRef<HTMLInputElement | null>(null);

  return (
    <VerticalPageLayout as="form" onSubmit={handleSubmit(onSubmit)}>
      <Flex gap="2">
        <FormControl isInvalid={!!errors.displayName}>
          <FormLabel>Display Name</FormLabel>
          <Input
            autoComplete="off"
            isDisabled={isSubmitting}
            {...register("displayName", {
              minLength: {
                value: 2,
                message: "Must be at least 2 characters long",
              },
              maxLength: {
                value: 64,
                message: "Cannot exceed 64 characters",
              },
            })}
          />
          <FormErrorMessage>{errors.displayName?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.username} isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            autoComplete="off"
            isDisabled={isSubmitting}
            {...register("username", {
              minLength: {
                value: 2,
                message: "Must be at least 2 characters long",
              },
              maxLength: {
                value: 64,
                message: "Cannot exceed 64 characters",
              },
              required: "Username is required",
              pattern: {
                value: /^[a-zA-Z0-9_-]{2,64}$/,
                message: "Only letters, numbers, underscores, and hyphens, and must be 2-64 characters",
              },
            })}
          />
          <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
      <Flex gap="2" alignItems="center">
        <FormControl isInvalid={!!errors.picture}>
          <FormLabel>Picture</FormLabel>
          <InputGroup>
            <Input
              onPaste={pictureUploadManage.onPaste}
              autoComplete="off"
              isDisabled={isSubmitting}
              placeholder="https://domain.com/path/picture.png"
              {...register("picture", { maxLength: 150 })}
            />
            <InputRightElement>
              <IconButton
                isLoading={pictureUploadManage.uploading}
                size="sm"
                icon={<OutboxIcon />}
                title="Upload picture"
                aria-label="Upload picture"
                onClick={() => pictureUploadRef.current?.click()}
              />
            </InputRightElement>
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              ref={pictureUploadRef}
              onChange={pictureUploadManage.onFileInputChange}
            />
          </InputGroup>
        </FormControl>
        <Avatar src={watch("picture")} size="lg" ignoreFallback />
      </Flex>
      <Flex gap="2" alignItems="center">
        <FormControl isInvalid={!!errors.banner}>
          <FormLabel>Banner</FormLabel>
          <InputGroup>
            <Input
              onPaste={bannerUploadManage.onPaste}
              autoComplete="off"
              isDisabled={isSubmitting}
              placeholder="https://domain.com/path/banner.png"
              {...register("banner", { maxLength: 150 })}
            />
            <InputRightElement>
              <IconButton
                isLoading={bannerUploadManage.uploading}
                size="sm"
                icon={<OutboxIcon />}
                title="Upload baner"
                aria-label="Upload banner"
                onClick={() => bannerUploadRef.current?.click()}
              />
            </InputRightElement>
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              ref={bannerUploadRef}
              onChange={bannerUploadManage.onFileInputChange}
            />
          </InputGroup>
        </FormControl>
        <Avatar src={watch("banner")} size="lg" ignoreFallback />
      </Flex>
      <FormControl isInvalid={!!errors.nip05}>
        <FormLabel>NIP-05 ID</FormLabel>
        <Input
          type="email"
          placeholder="user@domain.com"
          isDisabled={isSubmitting}
          {...register("nip05", {
            minLength: 5,
            validate: async (address) => {
              if (!address) return true;
              if (!address.includes("@")) return "Invalid address";

              const { name, domain } = parseNIP05Address(address) || {};
              if (!name || !domain) return "Failed to parsed address";

              const identity = await dnsIdentityLoader.fetchIdentity(name, domain);
              switch (identity.status) {
                case IdentityStatus.Error:
                  return "Failed to connect to server";
                case IdentityStatus.Missing:
                  return "Identity missing from server";
                case IdentityStatus.Found:
                  if (identity.pubkey !== account.pubkey) return "Pubkey does not match";
              }

              return true;
            },
          })}
        />
        <FormErrorMessage>{errors.nip05?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.website}>
        <FormLabel>Website</FormLabel>
        <Input
          type="url"
          autoComplete="off"
          placeholder="https://example.com"
          isDisabled={isSubmitting}
          {...register("website", { maxLength: 300 })}
        />
      </FormControl>
      <FormControl isInvalid={!!errors.about}>
        <FormLabel>About</FormLabel>
        <Textarea
          placeholder="A short description"
          resize="vertical"
          rows={6}
          isDisabled={isSubmitting}
          {...register("about")}
        />
      </FormControl>
      <FormControl isInvalid={!!errors.lightningAddress}>
        <FormLabel>Lightning Address (or LNURL)</FormLabel>
        <Input
          autoComplete="off"
          isDisabled={isSubmitting}
          {...register("lightningAddress", {
            validate: async (v) => {
              if (!v) return true;
              if (!isLNURL(v) && !isLightningAddress(v)) {
                return "Must be lightning address or LNURL";
              }
              const metadata = await lnurlMetadataService.requestMetadata(v);
              if (!metadata) {
                return "Incorrect or broken LNURL address";
              }
              return true;
            },
          })}
        />
        <FormErrorMessage>{errors.lightningAddress?.message}</FormErrorMessage>
      </FormControl>
      <Flex alignSelf="flex-end" gap="2">
        <Button as={Link} isExternal href="https://metadata.nostr.com/" rightIcon={<ExternalLinkIcon />}>
          Download Backup
        </Button>
        <Button onClick={() => reset()}>Reset</Button>
        <Button colorScheme="primary" isLoading={isSubmitting} type="submit">
          Update
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
};

export const ProfileEditView = () => {
  const publish = usePublishEvent();
  const readRelays = useReadRelays();
  const account = useActiveAccount()!;
  const metadata = useUserProfile(account.pubkey, readRelays, true);

  const defaultValues = useMemo<FormData>(
    () => ({
      displayName: metadata?.displayName || metadata?.display_name,
      username: metadata?.name,
      picture: metadata?.picture,
      banner: metadata?.banner,
      about: metadata?.about,
      website: metadata?.website,
      nip05: metadata?.nip05,
      lightningAddress: metadata?.lud16 || metadata?.lud06,
    }),
    [metadata],
  );

  const handleSubmit = async (data: FormData) => {
    const newMetadata: ProfileContent = {
      name: data.username,
      picture: data.picture,
      banner: data.banner,
    };
    if (data.displayName !== undefined) newMetadata.displayName = newMetadata.display_name = data.displayName;
    if (data.about !== undefined) newMetadata.about = data.about;
    if (data.website !== undefined) newMetadata.website = data.website;
    if (data.nip05 !== undefined) newMetadata.nip05 = data.nip05;

    if (data.lightningAddress) {
      if (isLNURL(data.lightningAddress)) {
        newMetadata.lud06 = data.lightningAddress;
      } else if (isLightningAddress(data.lightningAddress)) {
        newMetadata.lud16 = data.lightningAddress;
      }
    }

    const draft: EventTemplate = {
      created_at: unixNow(),
      kind: 0,
      content: JSON.stringify({ ...metadata, ...newMetadata }),
      tags: [],
    };

    await publish("Update Profile", draft, DEFAULT_LOOKUP_RELAYS);
  };

  return <MetadataForm defaultValues={defaultValues} onSubmit={handleSubmit} />;
};
