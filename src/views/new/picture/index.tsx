import { useState } from "react";
import { Button, Flex, Input, Spacer, Switch, useDisclosure, useToast } from "@chakra-ui/react";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { PicturePostBlueprint } from "applesauce-factory/blueprints";
import { useNavigate } from "react-router-dom";
import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";

import useCacheForm from "../../../hooks/use-cache-form";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import MagicTextArea from "../../../components/magic-textarea";
import NewMediaSlide from "./new-media-slide";
import MediaSlide from "./media-slide";
import { ErrorBoundary } from "../../../components/error-boundary";
import ZapSplitCreator, { Split } from "../note/zap-split-creator";
import SimpleView from "../../../components/layout/presets/simple-view";
import useUploadFile from "../../../hooks/use-upload-file";
import { getSharableEventAddress } from "../../../services/relay-hints";

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
  const { uploadFile } = useUploadFile();
  const navigate = useNavigate();

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

  const [loading, setLoading] = useState("");
  const submit = handleSubmit(async (values) => {
    try {
      const pictures: { url: string; alt?: string }[] = [];

      let i = 0;
      for (const media of values.media) {
        setLoading(`Uploading ${++i} of ${values.media.length}...`);

        // TODO: this should handle NIP-94 tags in the future
        const url = await uploadFile(media.file);
        if (url) pictures.push({ url, alt: media.alt });
      }

      setLoading("Creating post...");
      let draft = await factory.create(PicturePostBlueprint, pictures, values.content, {
        contentWarning: values.nsfw ? values.nsfwReason : undefined,
      });

      setLoading("Signing post...");
      const signed = await factory.sign(draft);

      setLoading("Publishing post...");
      await publish("Post picture", signed);

      toast({ status: "success", description: "Posted" });

      clearFormCache();
      navigate(`/pictures/${getSharableEventAddress(signed)}`);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  const showAdvanced = advanced.isOpen || getValues("nsfw") || getValues("split").length > 0;

  return (
    <SimpleView as="form" onSubmit={submit} maxW="4xl" center title="Picture post">
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
          <Button variant="ghost" onClick={advanced.onToggle}>
            Advanced
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
    </SimpleView>
  );
}
