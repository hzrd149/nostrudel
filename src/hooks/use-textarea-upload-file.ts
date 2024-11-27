import { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { nostrBuildUploadImage } from "../helpers/media-upload/nostr-build";
import { RefType } from "../components/magic-textarea";
import { useSigningContext } from "../providers/global/signing-provider";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import useAppSettings from "./use-app-settings";
import useUsersMediaServers from "./use-user-media-servers";
import { simpleMultiServerUpload } from "../helpers/media-upload/blossom";
import useCurrentAccount from "./use-current-account";
import { stripSensitiveMetadataOnFile } from "../helpers/image";
import insertTextIntoMagicTextarea from "../helpers/magic-textarea";

export function useTextAreaUploadFileWithForm(
  ref: MutableRefObject<RefType | null>,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
) {
  const insertText = useTextAreaInsertTextWithForm(ref, getValues, setValue);
  return useTextAreaUploadFile(insertText);
}

export function useTextAreaInsertTextWithForm(
  ref: MutableRefObject<RefType | null>,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
  field = "content",
) {
  const getText = useCallback(() => getValues()[field], [getValues, field]);
  const setText = useCallback(
    (text: string) => setValue(field, text, { shouldDirty: true, shouldTouch: true }),
    [setValue, field],
  );
  return useCallback(
    (text: string) => {
      if (ref.current) insertTextIntoMagicTextarea(ref.current, getText, setText, text);
    },
    [setText, getText],
  );
}

export default function useTextAreaUploadFile(insertText: (url: string) => void) {
  const toast = useToast();
  const account = useCurrentAccount();
  const { mediaUploadService } = useAppSettings();
  const { servers: mediaServers } = useUsersMediaServers(account?.pubkey);
  const { requestSignature } = useSigningContext();

  const [uploading, setUploading] = useState(false);
  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const safeFile = await stripSensitiveMetadataOnFile(file);
        if (mediaUploadService === "nostr.build") {
          const response = await nostrBuildUploadImage(safeFile, requestSignature);
          const imageUrl = response.url;
          insertText(imageUrl);
        } else if (mediaUploadService === "blossom" && mediaServers.length) {
          const blob = await simpleMultiServerUpload(
            mediaServers.map((s) => s.toString()),
            safeFile,
            requestSignature,
          );
          insertText(blob.url);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [insertText, toast, setUploading, mediaServers, mediaUploadService],
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
