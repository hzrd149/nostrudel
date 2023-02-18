import { Avatar, Button, Flex, FormControl, FormLabel, Input, Textarea, useToast } from "@chakra-ui/react";
import moment from "moment";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { isLNURL } from "../../helpers/lnurl";
import { Kind0ParsedContent } from "../../helpers/user-metadata";
import { useReadRelayUrls, useWriteRelayUrls } from "../../hooks/use-client-relays";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { useUserMetadata } from "../../hooks/use-user-metadata";
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
  lightningAddress?: string;
};

type MetadataFormProps = {
  defaultValues?: FormData;
  onSubmit: (data: FormData) => void;
};

const MetadataForm = ({ defaultValues, onSubmit }: MetadataFormProps) => {
  const isMobile = useIsMobile();
  const {
    register,
    reset,
    handleSubmit,
    getValues,
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
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input autoComplete="off" isDisabled={isSubmitting} {...register("displayName", { maxLength: 50 })} />
            </FormControl>
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                autoComplete="off"
                isRequired
                isDisabled={isSubmitting}
                isInvalid={!!errors.username}
                {...register("username", {
                  minLength: 2,
                  maxLength: 256,
                  required: true,
                  pattern: /^[a-zA-Z0-9_-]{4,16}$/,
                })}
              />
              {errors.username?.message}
            </FormControl>
          </Flex>
          <Flex gap="2" alignItems="center">
            <FormControl>
              <FormLabel>Picture</FormLabel>
              <Input autoComplete="off" isDisabled={isSubmitting} {...register("picture", { maxLength: 150 })} />
            </FormControl>
            <Avatar src={getValues("picture")} size="md" ignoreFallback />
          </Flex>
          <FormControl>
            <FormLabel>Website</FormLabel>
            <Input
              type="url"
              autoComplete="off"
              placeholder="https://example.com"
              isDisabled={isSubmitting}
              isInvalid={!!errors.website}
              {...register("website", { maxLength: 300 })}
            />
          </FormControl>
          <FormControl>
            <FormLabel>About</FormLabel>
            <Textarea
              placeholder="A short description"
              resize="vertical"
              rows={6}
              isDisabled={isSubmitting}
              isInvalid={!!errors.about}
              {...register("about")}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Lightning Address (or LNURL)</FormLabel>
            <Input
              autoComplete="off"
              isInvalid={!!errors.lightningAddress}
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
            {/* <FormHelperText>Don't forget the https://</FormHelperText> */}
          </FormControl>
          <Flex alignSelf="flex-end" gap="2">
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
  const account = useCurrentAccount();
  const metadata = useUserMetadata(account.pubkey, readRelays, true);

  const defaultValues = useMemo<FormData>(
    () => ({
      displayName: metadata?.display_name,
      username: metadata?.name,
      picture: metadata?.picture,
      about: metadata?.about,
      website: metadata?.website,
      lightningAddress: metadata?.lud16 || metadata?.lud06,
    }),
    [metadata]
  );

  const handleSubmit = async (data: FormData) => {
    try {
      const metadata: Kind0ParsedContent = {
        name: data.username,
        display_name: data.displayName,
        picture: data.picture,
        website: data.website,
      };

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
      userMetadataService.handleEvent(event);

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
