import { ChangeEventHandler, ClipboardEventHandler, useCallback } from "react";
import useUploadFile from "./use-upload-file";
import { UseFormSetValue } from "react-hook-form";

export function useInputUploadFileWithForm(setValue: UseFormSetValue<any>, field: string) {
  const setText = useCallback((text: string) => setValue(field, text), [setValue]);
  return useInputUploadFile(setText);
}

export default function useInputUploadFile(setText: (text: string) => void) {
  const { uploadFile, uploading } = useUploadFile();

  const privateUploadFile = useCallback(async (file: File) => {
    const imageUrl = await uploadFile(file);

    if (imageUrl)
      setText(imageUrl);
  }, [uploadFile])

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const img = e.target.files?.[0];
      if (img) privateUploadFile(img);
    },
    [privateUploadFile],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) privateUploadFile(imageFile);
    },
    [privateUploadFile],
  );

  return { uploadFile, uploading, onPaste, onFileInputChange };
}
