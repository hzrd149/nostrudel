import { Box, Image, ImageProps, useDisclosure } from "@chakra-ui/react";

export default function BlurredImage(props: ImageProps) {
  const { isOpen, onOpen } = useDisclosure();
  return (
    <Box overflow="hidden">
      <Image
        onClick={
          !isOpen
            ? (e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpen();
              }
            : undefined
        }
        cursor="pointer"
        filter={isOpen ? "" : "blur(1.5rem)"}
        {...props}
      />
    </Box>
  );
}
