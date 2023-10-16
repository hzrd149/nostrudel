import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Flex, Heading, VisuallyHiddenInput } from "@chakra-ui/react";

import ImagePlus from "../../components/icons/image-plus";
import { containerProps } from "./common";

export default function ProfileImageStep({
  displayName,
  onSubmit,
  onBack,
}: {
  displayName?: string;
  onSubmit: (picture?: File) => void;
  onBack: () => void;
}) {
  const [file, setFile] = useState<File>();
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <Flex gap="4" {...containerProps}>
      <Heading size="lg" mb="2">
        Add a profile image
      </Heading>
      <VisuallyHiddenInput
        type="file"
        accept="image/*"
        ref={uploadRef}
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <Avatar
        as="button"
        size="xl"
        src={preview}
        onClick={() => uploadRef.current?.click()}
        icon={<ImagePlus boxSize={8} />}
        autoFocus
      />
      <Heading size="md">{displayName}</Heading>
      <Button w="full" colorScheme="primary" maxW="sm" onClick={() => onSubmit(file)}>
        {file ? "Next" : "Skip for now"}
      </Button>
      <Button w="full" variant="link" onClick={onBack}>
        Back
      </Button>
    </Flex>
  );
}
