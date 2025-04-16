import { Flex, Text, VisuallyHiddenInput } from "@chakra-ui/react";
import { ChangeEventHandler, useRef } from "react";
import Plus from "../../../components/icons/plus";

export default function NewMediaSlide({ onSelect }: { onSelect: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement | null>(null);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault();

    const files = event.target.files;
    if (files && files.length > 0) {
      onSelect(Array.from(files));
    }
  };

  return (
    <>
      <Flex
        as="label"
        htmlFor="select-media"
        direction="column"
        gap="2"
        w="full"
        flexShrink={0}
        h="full"
        maxW="md"
        borderWidth="1px"
        rounded="md"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
      >
        <Plus boxSize={10} />
        <Text fontWeight="bold" fontSize="xl">
          Add media
        </Text>
      </Flex>

      <VisuallyHiddenInput
        id="select-media"
        type="file"
        accept="image/*"
        multiple
        ref={input}
        onChange={handleChange}
      />
    </>
  );
}
