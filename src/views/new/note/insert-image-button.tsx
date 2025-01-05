import { useRef } from "react";
import { IconButton, IconButtonProps, VisuallyHiddenInput } from "@chakra-ui/react";

import { UploadImageIcon } from "../../../components/icons";
import useTextAreaUploadFile from "../../../hooks/use-textarea-upload-file";

export default function InsertImageButton({
  onUploaded,
  ...props
}: Omit<IconButtonProps, "icon"> & { onUploaded: (url: string) => void }) {
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const { onFileInputChange, uploading } = useTextAreaUploadFile(onUploaded);

  return (
    <>
      <IconButton
        icon={<UploadImageIcon boxSize={6} />}
        onClick={() => imageUploadRef.current?.click()}
        isLoading={uploading}
        {...props}
      />
      <VisuallyHiddenInput
        type="file"
        accept="image/*,audio/*,video/*"
        ref={imageUploadRef}
        onChange={onFileInputChange}
      />
    </>
  );
}
