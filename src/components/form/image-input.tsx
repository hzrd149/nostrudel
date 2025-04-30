import { IconButton, Input, InputGroup, InputProps, InputRightElement, VisuallyHiddenInput } from "@chakra-ui/react";
import { useRef } from "react";

import useInputUploadFile from "../../hooks/use-input-upload-file";
import { OutboxIcon } from "../icons";

/** A URL input that with an upload button */
export default function ImageURLInput({
  onChange,
  ...props
}: Omit<InputProps, "onChange"> & {
  onChange: (value: string) => void;
}) {
  const upload = useInputUploadFile(onChange);
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <InputGroup>
      <Input
        type="url"
        onPaste={upload.onPaste}
        autoComplete="off"
        placeholder="https://example.com/path/picture.png"
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      <InputRightElement>
        <IconButton
          isLoading={upload.uploading}
          size="sm"
          icon={<OutboxIcon />}
          title="Upload image"
          aria-label="Upload image"
          onClick={() => ref.current?.click()}
        />
      </InputRightElement>
      <VisuallyHiddenInput type="file" accept="image/*" ref={ref} onChange={upload.onFileInputChange} />
    </InputGroup>
  );
}
