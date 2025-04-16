import { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback } from "react";

import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { RefType } from "../components/magic-textarea";
import insertTextIntoMagicTextarea from "../helpers/magic-textarea";
import useUploadFile from "./use-upload-file";

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
  const { uploadFile, uploading } = useUploadFile();

  const privateUploadFile = useCallback(
    async (file: File) => {
      const imageUrl = await uploadFile(file);

      if (imageUrl) insertText(imageUrl);
    },
    [uploadFile],
  );

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const img = e.target.files?.[0];
      if (img) privateUploadFile(img);
    },
    [privateUploadFile],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) privateUploadFile(imageFile);
    },
    [privateUploadFile],
  );

  return { uploadFile, uploading, onPaste, onFileInputChange };
}
