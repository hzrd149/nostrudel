import { Button, Flex, Heading, Spinner } from "@chakra-ui/react";
import { Navigate, useLocation } from "react-router-dom";
import useSubject from "../hooks/use-subject";
import identity from "../services/identity";

export const LoginView = () => {
  const setup = useSubject(identity.setup);
  const loading = useSubject(identity.loading);
  const location = useLocation();

  if (loading) return <Spinner />;
  if (setup) return <Navigate to={location.state.from} replace />;

  return (
    <Flex direction="column" alignItems="center" justifyContent="center">
      <Heading>Login</Heading>
      <Button onClick={() => identity.loginWithExtension()}>Use browser extension</Button>
    </Flex>
  );
};
