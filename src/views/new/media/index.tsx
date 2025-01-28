import {
  Alert,
  AlertIcon,
  Button,
  Divider,
  Flex,
  Heading,
  Input,
  Spacer,
  Switch,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import BackButton from "../../../components/router/back-button";
import useCacheForm from "../../../hooks/use-cache-form";
import { useActiveAccount } from "applesauce-react/hooks";
import { useEventFactory } from "applesauce-react/hooks";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import MagicTextArea from "../../../components/magic-textarea";
import NewMediaSlide from "./new-media-slide";
import MediaSlide from "./media-slide";
import { ErrorBoundary } from "../../../components/error-boundary";
import ZapSplitCreator, { Split } from "../note/zap-split-creator";

type FormValues = {
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  media: { id: string; alt?: string; file: File }[];
  split: Split[];
};

const setOptions = { shouldDirty: true, shouldTouch: true };

export default function NewMediaPostView() {
  const toast = useToast();
  const account = useActiveAccount()!;
  const factory = useEventFactory();
  const publish = usePublishEvent();

  const advanced = useDisclosure();

  const { getValues, reset, formState, handleSubmit, setValue, watch, register } = useForm<FormValues>({
    mode: "all",
    defaultValues: { media: [], content: "", nsfw: false, nsfwReason: "", split: [] },
  });

  watch("content");
  watch("media");
  watch("nsfw");
  watch("split");

  // TODO: cache for needs to save File and Blobs
  const clearFormCache = useCacheForm(
    "new-media-post",
    // @ts-expect-error
    getValues,
    reset,
    formState,
  );

  const submit = handleSubmit(async (values) => {
    try {
      // do something

      clearFormCache();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  const showAdvanced = advanced.isOpen || getValues("nsfw") || getValues("split").length > 0;

  return (
    <VerticalPageLayout as="form" onSubmit={submit} mx="auto" maxW="4xl" w="full">
      <Flex gap="2">
        <BackButton />
        <Heading>Media post</Heading>
      </Flex>

      <Alert status="info" flexShrink={0}>
        <AlertIcon />
        Work in progress, this view does not work yet
      </Alert>

      <Flex overflowY="hidden" overflowX="scroll" position="relative" h="md" flexShrink={0} gap="2" pb="2">
        {getValues("media")
          .filter((m) => m.file instanceof File)
          .map((media) => (
            <ErrorBoundary key={media.id}>
              <MediaSlide
                alt={media.alt}
                file={media.file}
                onChange={(alt) =>
                  setValue(
                    "media",
                    getValues("media").map((m) => (m.id === media.id ? { ...media, alt } : m)),
                    setOptions,
                  )
                }
                onRemove={() =>
                  setValue(
                    "media",
                    getValues("media").filter((m) => m.id !== media.id),
                    setOptions,
                  )
                }
              />
            </ErrorBoundary>
          ))}
        <NewMediaSlide
          onSelect={(files) =>
            setValue("media", [...files.map((file) => ({ id: nanoid(6), file })), ...getValues("media")], setOptions)
          }
        />
      </Flex>

      <MagicTextArea
        value={getValues().content}
        onChange={(e) => setValue("content", e.target.value, setOptions)}
        rows={3}
        placeholder="Add a caption"
      />

      {showAdvanced && (
        <>
          <Flex gap="2" alignItems="center" mt="2">
            <Divider />
            <Heading size="sm">Advanced</Heading>
            <Divider />
          </Flex>
          <Flex gap="2" direction="column">
            <Switch {...register("nsfw")}>NSFW</Switch>
            {getValues().nsfw && (
              <Input {...register("nsfwReason", { required: true })} placeholder="NSFW Reason" isRequired />
            )}
          </Flex>

          <ZapSplitCreator
            splits={getValues("split")}
            onChange={(splits) => setValue("split", splits, setOptions)}
            authorPubkey={account?.pubkey}
          />
        </>
      )}

      <Flex gap="2">
        {!showAdvanced && (
          <Button variant="link" p="2" onClick={advanced.onOpen}>
            Show advanced
          </Button>
        )}
        <Spacer />
        {formState.isDirty && (
          <Button variant="ghost" onClick={() => confirm("Clear draft?") && reset()}>
            Clear
          </Button>
        )}
        <Button type="submit" colorScheme="primary">
          Preview
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}
