import { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { nostrBuildUploadImage } from "../helpers/media-upload/nostr-build";
import { RefType } from "../components/magic-textarea";
import { useSigningContext } from "../providers/global/signing-provider";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import useAppSettings from "./use-app-settings";
import useUsersMediaServers from "./use-user-media-servers";
import { uploadFileToServers } from "../helpers/media-upload/blossom";
import useCurrentAccount from "./use-current-account";

export function useTextAreaUploadFileWithForm(
  ref: MutableRefObject<RefType | null>,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
) {
  const getText = useCallback(() => getValues().content, [getValues]);
  const setText = useCallback(
    (text: string) => setValue("content", text, { shouldDirty: true, shouldTouch: true }),
    [setValue],
  );
  return useTextAreaUploadFile(ref, getText, setText);
}

export default function useTextAreaUploadFile(
  ref: MutableRefObject<RefType | null>,
  getText: () => string,
  setText: (text: string) => void,
) {
  const toast = useToast();
  const account = useCurrentAccount();
  const { mediaUploadService } = useAppSettings();
  const { servers: mediaServers } = useUsersMediaServers(account?.pubkey);
  const { requestSignature } = useSigningContext();

  const insertURL = useCallback(
    (url: string) => {
      const content = getText();
      const position = ref.current?.getCaretPosition();
      if (position !== undefined) {
        let inject = url;

        // add a space before
        if (position >= 1 && content.slice(position - 1, position) !== " ") inject = " " + inject;
        // add a space after
        if (position < content.length && content.slice(position, position + 1) !== " ") inject = inject + " ";

        setText(content.slice(0, position) + inject + content.slice(position));
      } else {
        let inject = url;

        // add a space before if there isn't one
        if (content.slice(content.length - 1) !== " ") inject = " " + inject;

        setText(content + inject + " ");
      }
    },
    [setText, getText],
  );

  const [uploading, setUploading] = useState(false);
  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        if (mediaUploadService === "nostr.build") {
          const response = await nostrBuildUploadImage(file, requestSignature);
          const imageUrl = response.url;
          insertURL(imageUrl);
        } else if (mediaUploadService === "blossom" && mediaServers.length) {
          const blob = await uploadFileToServers(
            mediaServers.map((s) => s.toString()),
            file,
            requestSignature,
          );
          insertURL(blob.url);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [insertURL, toast, setUploading, mediaServers, mediaUploadService],
  );

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const img = e.target.files?.[0];
      if (img) uploadFile(img);
    },
    [uploadFile],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) uploadFile(imageFile);
    },
    [uploadFile],
  );

  return { uploadFile, uploading, onPaste, onFileInputChange };
}
