import { Center, Spinner, Text, useToast } from "@chakra-ui/react";
import { PicturePostBlueprint } from "applesauce-factory/blueprints";
import { useEventFactory } from "applesauce-react/hooks";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import { getSharableEventAddress } from "../../../services/relay-hints";

import useUploadFile from "../../../hooks/use-upload-file";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import PicturePostForm, { FormValues } from "./picture-post-form";

export default function NewPictureView() {
  const toast = useToast();
  const factory = useEventFactory();
  const publish = usePublishEvent();
  const { uploadFile } = useUploadFile();
  const navigate = useNavigate();

  const [loading, setLoading] = useState("");
  const submit = async (values: FormValues) => {
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

    navigate(`/pictures/${getSharableEventAddress(signed)}`);
  };

  return (
    <SimpleView maxW="4xl" center title="Picture post">
      {loading ? (
        <Center>
          <Spinner size="lg" />
          <Text>{loading}</Text>
        </Center>
      ) : (
        <PicturePostForm onSubmit={submit} />
      )}
    </SimpleView>
  );
}
