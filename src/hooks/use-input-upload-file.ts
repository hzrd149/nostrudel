import { ChangeEventHandler, ClipboardEventHandler, useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";

import useUploadFile from "./use-upload-file";

export function useInputUploadFileWithForm(setValue: UseFormSetValue<any>, field: string) {
  const setText = useCallback((text: string) => setValue(field, text), [setValue]);
  return useInputUploadFile(setText);
}

export default function useInputUploadFile(setText: (text: string) => void) {
  const uploadFile = useUploadFile();

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const img = e.target.files?.[0];
      if (img) {
        const upload = await uploadFile.run(img);
        if (upload) setText(upload.url);
      }
    },
    [uploadFile.run, setText],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    async (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) {
        const upload = await uploadFile.run(imageFile);
        if (upload) setText(upload.url);
      }
    },
    [uploadFile.run, setText],
  );

  return { uploadFile: uploadFile.run, uploading: uploadFile.loading, onPaste, onFileInputChange };
}
