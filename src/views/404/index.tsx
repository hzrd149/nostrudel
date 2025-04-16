import { Button, Flex, Heading, Image, Text } from "@chakra-ui/react";
import styled from "@emotion/styled";
import RouterLink from "../../components/router-link";

const ImageContainer = styled.div`
  border-width: 1rem;
  border-color: red;
  border-style: solid;
  box-sizing: content-box;
  position: relative;
  border-radius: 50%;
  overflow: hidden;

  :after {
    content: "";
    display: block;
    position: absolute;
    top: calc(50% - 0.75rem);
    left: -10%;
    transform: rotateZ(-45deg);
    width: 120%;
    height: 1.5rem;
    background: red;
  }
`;

export default function NoteFoundView() {
  return (
    <Flex direction="column" p="2" gap="10" w="full" alignItems="center" h="full" pt="15vh">
      <ImageContainer>
        <Image src="/logo.svg" w="48" />
      </ImageContainer>
      <Heading fontSize="9xl" fontFamily="monospace">
        404
      </Heading>
      <Text fontSize="3xl" mb="10">
        Looks like that page does not exist
      </Text>
      <Button size="lg" colorScheme="primary" as={RouterLink} to="/">
        Return home
      </Button>
    </Flex>
  );
}
