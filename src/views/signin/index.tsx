import { Avatar, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router";
import useCurrentAccount from "../../hooks/use-current-account";

export default function LoginView() {
  const current = useCurrentAccount();
  const location = useLocation();

  if (current) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <>
      <Flex w="full" justifyContent="center">
        <Flex direction="column" alignItems="center" gap="2" maxW="md" w="full" px="4" py="10">
          <Avatar src="/apple-touch-icon.png" size="lg" flexShrink={0} />
          <Heading size="lg" mb="2">
            Sign in
          </Heading>
          <Outlet />
        </Flex>
      </Flex>
    </>
  );
}
