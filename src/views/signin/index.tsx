import { Avatar, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useActiveAccount } from "applesauce-react/hooks";

export default function SigninView() {
  const current = useActiveAccount();
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
