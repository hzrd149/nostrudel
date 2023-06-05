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
  useToast,
} from "@chakra-ui/react";
import moment from "moment";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { ExternalLinkIcon } from "../../components/icons";
import { isLNURL } from "../../helpers/lnurl";
import { Kind0ParsedContent } from "../../helpers/user-metadata";
import { useReadRelayUrls, useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import dnsIdentityService from "../../services/dns-identity";
import signingService from "../../services/signing";
import userMetadataService from "../../services/user-metadata";
import { DraftNostrEvent } from "../../types/nostr-event";

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
  const isMobile = useIsMobile();
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
    <Flex direction="column" pb="4" overflow="auto" px={isMobile ? "2" : 0}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="2" pt="4">
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
                    const id = await dnsIdentityService.getIdentity(address);
                    if (!id) return "Cant find NIP-05 ID";
                    if (id.pubkey !== account.pubkey) return "Pubkey dose not match";
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
                validate: (v) => {
                  if (v && !isLNURL(v) && !isLightningAddress(v)) {
                    return "Must be lightning address or LNURL";
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
            <Button colorScheme="brand" isLoading={isSubmitting} type="submit">
              Update
            </Button>
          </Flex>
        </Flex>
      </form>
    </Flex>
  );
};

export const ProfileEditView = () => {
  const writeRelays = useWriteRelayUrls();
  const readRelays = useReadRelayUrls();
  const toast = useToast();
  const account = useCurrentAccount()!;
  const metadata = useUserMetadata(account.pubkey, readRelays, true);

  const defaultValues = useMemo<FormData>(
    () => ({
      displayName: metadata?.display_name,
      username: metadata?.name,
      picture: metadata?.picture,
      about: metadata?.about,
      website: metadata?.website,
      nip05: metadata?.nip05,
      lightningAddress: metadata?.lud16 || metadata?.lud06,
    }),
    [metadata]
  );

  const handleSubmit = async (data: FormData) => {
    try {
      const metadata: Kind0ParsedContent = {
        name: data.username,
        picture: data.picture,
      };
      if (data.displayName) metadata.display_name = data.displayName;
      if (data.about) metadata.about = data.about;
      if (data.website) metadata.website = data.website;
      if (data.nip05) metadata.nip05 = data.nip05;

      if (data.lightningAddress) {
        if (isLNURL(data.lightningAddress)) {
          metadata.lud06 = data.lightningAddress;
        } else if (isLightningAddress(data.lightningAddress)) {
          metadata.lud16 = data.lightningAddress;
        }
      }

      const draft: DraftNostrEvent = {
        created_at: moment().unix(),
        kind: 0,
        content: JSON.stringify(metadata),
        tags: [],
      };

      const event = await signingService.requestSignature(draft, account);
      const results = nostrPostAction(writeRelays, event);
      userMetadataService.receiveEvent(event);

      await results.onComplete;
    } catch (e) {
      if (e instanceof Error) {
        toast({
          status: "error",
          description: e.message,
        });
      }
    }
  };

  return <MetadataForm defaultValues={defaultValues} onSubmit={handleSubmit} />;
};
