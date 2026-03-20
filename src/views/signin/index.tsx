import { Avatar, Flex, Heading } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import RouterLink from "../../components/router-link";

export default function SigninView() {
  const current = useActiveAccount();
  const location = useLocation();

  if (current) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <Flex w="full" minH="100vh" overflowY="auto" justifyContent="center" px="4" py="10">
      <Flex direction="column" gap="4" maxW="lg" w="full">
        <Flex as={RouterLink} to="/" alignItems="center" gap="3">
          <Avatar src="/apple-touch-icon.png" size="md" flexShrink={0} />
          <Heading size="lg">Sign in</Heading>
        </Flex>
        <Outlet />
      </Flex>
    </Flex>
  );
}
