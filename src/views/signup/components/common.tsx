import { Avatar, FlexProps } from "@chakra-ui/react";

export const AppIcon = () => <Avatar src="/apple-touch-icon.png" size="lg" flexShrink={0} />;

export const containerProps: FlexProps = {
  w: "full",
  maxW: "sm",
  mx: "4",
  alignItems: "center",
  direction: "column",
};
