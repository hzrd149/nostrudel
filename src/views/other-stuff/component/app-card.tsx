import { ReactNode } from "react";
import { Link as RouterLink, To } from "react-router-dom";
import { Box, Card, ComponentWithAs, Flex, Heading, IconProps, Image, LinkBox, Text } from "@chakra-ui/react";

import HoverLinkOverlay from "../../../components/hover-link-overlay";

export type App = {
  icon?: ComponentWithAs<"svg", IconProps>;
  image?: string;
  title: string;
  description: string;
  id: string;
  isExternal?: boolean;
  to: To;
};

export default function AppCard({ app, onClick }: { app: App; onClick?: () => void }) {
  let icon: ReactNode = null;
  if (app.icon) {
    const Icon = app.icon;
    icon = <Icon boxSize={10} />;
  } else if (app.image) icon = <Image src={app.image} h="10" aspectRatio={1} />;

  return (
    <Flex as={LinkBox} gap="4" alignItems="flex-start">
      <Card p="3" borderRadius="lg">
        {icon}
      </Card>
      <Flex direction="column" gap="2" py="2">
        <Heading size="md">
          {app.isExternal && typeof app.to === "string" ? (
            <HoverLinkOverlay href={app.to} isExternal onClick={onClick}>
              {app.title}
            </HoverLinkOverlay>
          ) : (
            <HoverLinkOverlay as={RouterLink} to={app.to} onClick={onClick}>
              {app.title}
            </HoverLinkOverlay>
          )}
        </Heading>
        <Text>{app.description}</Text>
      </Flex>
    </Flex>
  );
}
