import { ReactNode } from "react";
import { Box, Button, Flex, FlexProps, IconButton, Image, Input } from "@chakra-ui/react";

import useObjectURL from "../../../hooks/use-object-url";
import { CloseIcon } from "@chakra-ui/icons";

function ImagePreview({ file }: { file: File }) {
  const url = useObjectURL(file);

  return <Image src={url} w="auto" h="auto" maxW="full" maxH="full" />;
}
function VideoPreview({ file }: { file: File }) {
  const url = useObjectURL(file);

  // TODO: make better
  return <Box as="video" src={url} w="auto" h="auto" maxW="full" maxH="full" />;
}

export type MediaSlideProps = Omit<FlexProps, "children" | "onChange"> & {
  file: File;
  alt?: string;
  onChange?: (alt: string) => void;
  onRemove?: () => void;
};

export default function MediaSlide({ file, onChange, alt, onRemove, ...props }: MediaSlideProps) {
  let preview: ReactNode;
  if (file.type.includes("image/")) preview = <ImagePreview file={file} />;
  else if (file.type.includes("video/")) preview = <VideoPreview file={file} />;
  else preview = null;

  return (
    <Flex
      h="full"
      maxW="min(100%, var(--chakra-sizes-lg))"
      direction="column"
      gap="2"
      flexShrink={0}
      overflow="hidden"
      alignItems="center"
      {...props}
    >
      <Flex overflow="hidden" alignItems="center" justifyContent="center" position="relative" w="max-content">
        {preview}
      </Flex>
      <Flex gap="2" w="full" justifyContent="flex-end">
        {alt !== undefined ? (
          <Input value={alt} onChange={(e) => onChange?.(e.target.value)} placeholder="Alt text for media" p="2" />
        ) : (
          <Button variant="link" onClick={() => onChange?.("")}>
            add alt text
          </Button>
        )}
        <IconButton aria-label="Remove" icon={<CloseIcon />} colorScheme="red" variant="ghost" onClick={onRemove} />
      </Flex>
    </Flex>
  );
}
