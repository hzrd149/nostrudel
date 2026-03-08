import { ChangeEventHandler, ClipboardEventHandler, MutableRefObject, useCallback } from "react";

import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { RefType } from "../components/magic-textarea";
import insertTextIntoMagicTextarea from "../helpers/magic-textarea";
import { useUploadContext } from "../providers/local/upload-provider";
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

const DONE_REMOVE_DELAY_MS = 3_000;
const ERROR_REMOVE_DELAY_MS = 6_000;

export default function useTextAreaUploadFile(insertText: (url: string) => void) {
  const uploadFile = useUploadFile();
  const uploadCtx = useUploadContext();

  const runUpload = useCallback(
    async (file: File) => {
      if (!uploadCtx) {
        // No provider — fall back to original behaviour
        const upload = await uploadFile.run(file);
        if (upload?.url) insertText(upload.url);
        return;
      }

      const id = uploadCtx.addUpload(file);
      uploadCtx.updateUpload(id, { status: "uploading" });

      try {
        const upload = await uploadFile.run(file);
        if (upload?.url) {
          uploadCtx.updateUpload(id, { status: "done", url: upload.url });
          insertText(upload.url);
          setTimeout(() => uploadCtx.removeUpload(id), DONE_REMOVE_DELAY_MS);
        } else {
          uploadCtx.updateUpload(id, { status: "error", error: "Upload returned no URL" });
          setTimeout(() => uploadCtx.removeUpload(id), ERROR_REMOVE_DELAY_MS);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        uploadCtx.updateUpload(id, { status: "error", error: message });
        setTimeout(() => uploadCtx.removeUpload(id), ERROR_REMOVE_DELAY_MS);
      }
    },
    [uploadFile.run, uploadCtx, insertText],
  );

  const onFileInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const img = e.target.files?.[0];
      if (img) await runUpload(img);
    },
    [runUpload],
  );

  const onPaste = useCallback<ClipboardEventHandler<HTMLTextAreaElement>>(
    async (e) => {
      const imageFile = Array.from(e.clipboardData.files).find((f) => f.type.includes("image"));
      if (imageFile) await runUpload(imageFile);
    },
    [runUpload],
  );

  // isUploading: prefer context-level state (covers all concurrent uploads),
  // fall back to the single-upload boolean from useAsyncAction
  const isUploading = uploadCtx ? uploadCtx.isUploading : uploadFile.loading;

  return { uploadFile: runUpload, uploading: isUploading, onPaste, onFileInputChange };
}
