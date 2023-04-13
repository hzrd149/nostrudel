import { Flex } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useAppTitle } from "../../hooks/use-app-title";

export default function HashTagView() {
  const { hashtag } = useParams() as { hashtag: string };
  useAppTitle("#" + hashtag);

  return <Flex direction="column" gap="4" overflow="auto" flex={1} pb="4" pt="4" pl="1" pr="1"></Flex>;
}
