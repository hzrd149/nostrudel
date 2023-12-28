import { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback, useState } from "react";
import { useToast } from "@chakra-ui/react";

import { nostrBuildUploadImage } from "../helpers/nostr-build";
import { RefType } from "../components/magic-textarea";
import { useSigningContext } from "../providers/global/signing-provider";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";

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
  const { requestSignature } = useSigningContext();

  const [uploading, setUploading] = useState(false);
  const uploadFile = useCallback(
    async (file: File) => {
      try {
        if (!(file.type.includes("image") || file.type.includes("video") || file.type.includes("audio")))
          throw new Error("Unsupported file type");

        setUploading(true);

        const response = await nostrBuildUploadImage(file, requestSignature);
        const imageUrl = response.url;

        const content = getText();
        const position = ref.current?.getCaretPosition();
        if (position !== undefined) {
          setText(content.slice(0, position) + imageUrl + " " + content.slice(position));
        } else setText(content + imageUrl + " ");
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setUploading(false);
    },
    [setText, getText, toast, setUploading],
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
