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
  const uploadFile = useUploadFile();

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const img = e.target.files?.[0];
      if (img) {
        const upload = await uploadFile.run(img);
        if (upload) insertText(upload.url);
      }
    },
    [uploadFile.run],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    async (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) {
        const upload = await uploadFile.run(imageFile);
        if (upload) insertText(upload.url);
      }
    },
    [uploadFile.run],
  );

  return { uploadFile: uploadFile.run, uploading: uploadFile.loading, onPaste, onFileInputChange };
}
