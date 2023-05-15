import { Alert, AlertDescription, AlertIcon, AlertProps, AlertTitle, Button, Spacer, useModal } from "@chakra-ui/react";
import { useIsMobile } from "../hooks/use-is-mobile";
import { useExpand } from "./note/expanded";

export default function SensitiveContentWarning({ description }: { description: string } & AlertProps) {
  const isMobile = useIsMobile();
  const expand = useExpand();

  if (isMobile) {
    return (
      <Alert
        status="warning"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Sensitive Content
        </AlertTitle>
        <AlertDescription maxWidth="sm">{description}</AlertDescription>
        <Button mt="2" onClick={expand?.onExpand} colorScheme="red">
          Show
        </Button>
      </Alert>
    );
  }

  return (
    <Alert status="warning">
      <AlertIcon boxSize="30px" mr="4" />
      <AlertTitle fontSize="lg">Sensitive Content</AlertTitle>
      <AlertDescription maxWidth="sm">{description}</AlertDescription>
      <Spacer />
      <Button mt="2" onClick={expand?.onExpand} colorScheme="red">
        Show
      </Button>
    </Alert>
  );
}
