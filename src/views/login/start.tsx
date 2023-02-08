import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Spinner } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import useSubject from "../../hooks/use-subject";
import identity from "../../services/identity";

export const LoginStartView = () => {
  const navigate = useNavigate();
  const loading = useSubject(identity.loading);
  if (loading) return <Spinner />;

  return (
    <>
      <Alert status="warning" maxWidth="30rem">
        <AlertIcon />
        <Box>
          <AlertTitle>This app is half-baked.</AlertTitle>
          <AlertDescription>There are bugs and things will break.</AlertDescription>
        </Box>
      </Alert>
      <Button onClick={() => identity.loginWithExtension()} colorScheme="brand">
        Use browser extension
      </Button>
      <Button variant="link" onClick={() => navigate("./npub")}>
        Login with npub
      </Button>
    </>
  );
};
