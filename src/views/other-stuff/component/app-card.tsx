import { Link as RouterLink, To } from "react-router-dom";
import { Card, ComponentWithAs, Flex, Heading, IconProps, Image, LinkBox, Text } from "@chakra-ui/react";

import HoverLinkOverlay from "../../../components/hover-link-overlay";

export type App = {
  icon?: ComponentWithAs<"svg", IconProps>;
  image?: string;
  title: string;
  description: string;
  id: string;
  isExternal?: boolean;
  to: string;
};

export function AppIcon({ app, size }: { app: App; size: string }) {
  if (app.icon) {
    const Icon = app.icon;
    return <Icon boxSize={size} />;
  } else if (app.image) return <Image src={app.image} h={size} aspectRatio={1} />;
  return null;
}

export default function AppCard({ app, onClick }: { app: App; onClick?: () => void }) {
  return (
    <Flex as={LinkBox} gap="4" alignItems="flex-start">
      <Card p="3" borderRadius="lg">
        <AppIcon app={app} size="10" />
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
