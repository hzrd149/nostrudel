import { Button, Flex, Input, Spacer, Switch, useDisclosure, useToast } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";

import { ErrorBoundary } from "../../../components/error-boundary";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import MagicTextArea from "../../../components/magic-textarea";
import useCacheForm from "../../../hooks/use-cache-form";
import ZapSplitCreator, { Split } from "../note/zap-split-creator";
import MediaSlide from "./media-slide";
import NewMediaSlide from "./new-media-slide";

export type FormValues = {
  content: string;
  nsfw: boolean;
  nsfwReason: string;
  media: { id: string; alt?: string; file: File }[];
  split: Split[];
};

const setOptions = { shouldDirty: true, shouldTouch: true };

export default function PicturePostForm({ onSubmit }: { onSubmit: (values: FormValues) => Promise<void> }) {
  const toast = useToast();
  const account = useActiveAccount()!;

  const advanced = useDisclosure();

  const { getValues, reset, formState, handleSubmit, setValue, watch, register } = useForm<FormValues>({
    mode: "all",
    defaultValues: { media: [], content: "", nsfw: false, nsfwReason: "", split: [] },
  });

  watch("content");
  watch("media");
  watch("nsfw");
  watch("split");

  // TODO: cache form needs to save File and Blobs
  const clearFormCache = useCacheForm(
    "new-media-post",
    // @ts-expect-error
    getValues,
    reset,
    formState,
  );

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      clearFormCache();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  const showAdvanced = advanced.isOpen || getValues("nsfw") || getValues("split").length > 0;

  return (
    <form onSubmit={submit}>
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

      <Flex direction="column" gap="2">
        <MagicTextArea
          value={getValues().content}
          onChange={(e) => setValue("content", e.target.value, setOptions)}
          rows={3}
          placeholder="Short description"
        />

        <Flex gap="2">
          <Button
            variant="link"
            onClick={advanced.onToggle}
            rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
          >
            More Options
          </Button>
          <Spacer />
          {formState.isDirty && (
            <Button variant="ghost" onClick={() => confirm("Clear draft?") && reset()}>
              Clear
            </Button>
          )}
          <Button type="submit" colorScheme="primary">
            Post
          </Button>
        </Flex>

        {showAdvanced && (
          <>
            <Flex direction={{ base: "column", lg: "row" }} gap="4" mt="2">
              <Flex gap="2" direction="column" flex={1}>
                <Switch {...register("nsfw")}>NSFW</Switch>
                {getValues().nsfw && (
                  <Input {...register("nsfwReason", { required: true })} placeholder="NSFW Reason" isRequired />
                )}
              </Flex>

              <Flex direction="column" flex={1}>
                <ZapSplitCreator
                  splits={getValues("split")}
                  onChange={(splits) => setValue("split", splits, setOptions)}
                  authorPubkey={account?.pubkey}
                />
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </form>
  );
}
