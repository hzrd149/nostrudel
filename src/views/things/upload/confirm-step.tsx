import { useState } from "react";
import { Button, ButtonGroup, Flex, Heading, Image, Text } from "@chakra-ui/react";

import useObjectURL from "../../../hooks/use-object-url";
import BackButton from "../../../components/back-button";

export default function ConfirmStep({
  screenshot,
  name,
  hash,
  summary,
  onConfirm,
}: {
  screenshot: Blob;
  name: string;
  summary: string;
  hash: string;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const objectURL = useObjectURL(screenshot);

  const confirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Flex gap="2" direction="column" maxW="40rem" w="full" mx="auto">
      <Image src={objectURL} maxW="2xl" />
      <Heading size="md">{name}</Heading>
      <Text>File Hash: {hash}</Text>
      <Text whiteSpace="pre-line">{summary}</Text>
      <ButtonGroup ml="auto">
        <BackButton />
        <Button onClick={confirm} isLoading={loading} colorScheme="primary">
          Upload
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
