import { useEffect, useMemo } from "react";
import {
  Avatar,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
  Textarea,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

import { ExternalLinkIcon } from "../../components/icons";
import { isLNURL } from "../../helpers/lnurl";
import { Kind0ParsedContent } from "../../helpers/nostr/user-metadata";
import { useReadRelays } from "../../hooks/use-client-relays";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserMetadata from "../../hooks/use-user-metadata";
import dnsIdentityService from "../../services/dns-identity";
import { DraftNostrEvent } from "../../types/nostr-event";
import lnurlMetadataService from "../../services/lnurl-metadata";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { COMMON_CONTACT_RELAY } from "../../const";
import { usePublishEvent } from "../../providers/global/publish-provider";

const isEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function isLightningAddress(addr: string) {
  return isEmail.test(addr);
}

type FormData = {
  displayName?: string;
  username?: string;
  picture?: string;
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
  const account = useCurrentAccount()!;
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  return (
    <VerticalPageLayout as="form" onSubmit={handleSubmit(onSubmit)}>
      <Flex gap="2">
        <FormControl isInvalid={!!errors.displayName}>
          <FormLabel>Display Name</FormLabel>
          <Input
            autoComplete="off"
            isDisabled={isSubmitting}
            {...register("displayName", {
              minLength: 2,
              maxLength: 64,
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
              minLength: 2,
              maxLength: 64,
              required: true,
              pattern: /^[a-zA-Z0-9_-]{4,64}$/,
            })}
          />
          <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
      <Flex gap="2" alignItems="center">
        <FormControl isInvalid={!!errors.picture}>
          <FormLabel>Picture</FormLabel>
          <Input
            autoComplete="off"
            isDisabled={isSubmitting}
            placeholder="https://domain.com/path/picture.png"
            {...register("picture", { maxLength: 150 })}
          />
        </FormControl>
        <Avatar src={watch("picture")} size="lg" ignoreFallback />
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
              try {
                const id = await dnsIdentityService.fetchIdentity(address);
                if (!id) return "Cant find NIP-05 ID";
                if (id.pubkey !== account.pubkey) return "Pubkey does not match";
              } catch (e) {
                return "Failed to fetch ID";
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
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey, readRelays, { alwaysRequest: true });

  const defaultValues = useMemo<FormData>(
    () => ({
      displayName: metadata?.displayName || metadata?.display_name,
      username: metadata?.name,
      picture: metadata?.picture,
      about: metadata?.about,
      website: metadata?.website,
      nip05: metadata?.nip05,
      lightningAddress: metadata?.lud16 || metadata?.lud06,
    }),
    [metadata],
  );

  const handleSubmit = async (data: FormData) => {
    const newMetadata: Kind0ParsedContent = {
      name: data.username,
      picture: data.picture,
    };
    if (data.displayName) newMetadata.displayName = newMetadata.display_name = data.displayName;
    if (data.about) newMetadata.about = data.about;
    if (data.website) newMetadata.website = data.website;
    if (data.nip05) newMetadata.nip05 = data.nip05;

    if (data.lightningAddress) {
      if (isLNURL(data.lightningAddress)) {
        newMetadata.lud06 = data.lightningAddress;
      } else if (isLightningAddress(data.lightningAddress)) {
        newMetadata.lud16 = data.lightningAddress;
      }
    }

    const draft: DraftNostrEvent = {
      created_at: dayjs().unix(),
      kind: 0,
      content: JSON.stringify({ ...metadata, ...newMetadata }),
      tags: [],
    };

    await publish("Update Profile", draft, [COMMON_CONTACT_RELAY]);
  };

  return <MetadataForm defaultValues={defaultValues} onSubmit={handleSubmit} />;
};
