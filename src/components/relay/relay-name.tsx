import { Text, TextProps } from "@chakra-ui/react";

export type RelyNameProps = {
  relay: string;
};

export default function RelayName({ relay, ...props }: RelyNameProps & Omit<TextProps, "children">) {
  const name = relay.replace("wss://", "").replace("ws://", "").replace(/\/$/, "");

  return (
    <Text as="span" {...props}>
      {name}
    </Text>
  );
}
