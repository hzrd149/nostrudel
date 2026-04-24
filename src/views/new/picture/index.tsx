import { Flex, Spinner, Text, useToast } from "@chakra-ui/react";
import { PicturePostFactory } from "applesauce-common/factories";
import { FileMetadataFields } from "applesauce-common/helpers";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SimpleView from "~/components/layout/presets/simple-view";
import useUploadFile from "~/hooks/use-upload-file";
import { usePublishEvent } from "~/providers/global/publish-provider";
import { getSharableEventAddress } from "~/services/relay-hints";
import PicturePostForm, { FormValues } from "./picture-post-form";

export default function NewPictureView() {
  const toast = useToast();
  const publish = usePublishEvent();
  const uploadFile = useUploadFile();
  const navigate = useNavigate();

  const [loading, setLoading] = useState("");
  const submit = async (values: FormValues) => {
    const pictures: FileMetadataFields[] = [];

    let i = 0;
    for (const media of values.media) {
      setLoading(`Uploading ${++i} of ${values.media.length}...`);

      const picture = await uploadFile.run(media.file);
      if (picture) pictures.push(picture);
    }

    setLoading("Creating post...");
    let draft = PicturePostFactory.create(pictures, values.content).caption(values.content);
    if (values.nsfw) draft = draft.contentWarning(values.nsfwReason);

    setLoading("Publishing post...");
    const pub = await publish("Post picture", await draft);

    toast({ status: "success", description: "Posted" });

    if (pub) navigate(`/pictures/${getSharableEventAddress(pub.event)}`);
  };

  return (
    <SimpleView maxW="4xl" center title="Picture post">
      {loading ? (
        <Flex gap="2" alignItems="center" justifyContent="center" h="full">
          <Spinner size="lg" />
          <Text>{loading}</Text>
        </Flex>
      ) : (
        <PicturePostForm onSubmit={submit} />
      )}
    </SimpleView>
  );
}
