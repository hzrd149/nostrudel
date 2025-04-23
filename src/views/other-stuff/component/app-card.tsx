import { Link as RouterLink } from "react-router-dom";
import { Card, Flex, Heading, Image, LinkBox, Text } from "@chakra-ui/react";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { App } from "../../../components/navigation/apps";
import AppFavoriteButton from "../../../components/navigation/app-favorite-button";

export function AppIcon({ app, size }: { app: App; size: string }) {
  if (app.icon) {
    const Icon = app.icon;
    return <Icon boxSize={size} aria-hidden="true" />;
  } else if (app.image) return <Image src={app.image} h={size} aspectRatio={1} alt={`${app.title} icon`} />;
  return null;
}

export default function AppCard({
  app,
  canFavorite = true,
  onClick,
}: {
  app: App;
  onClick?: () => void;
  canFavorite?: boolean;
}) {
  return (
    <Flex
      as={LinkBox}
      gap="4"
      alignItems="flex-start"
      role="article"
      aria-labelledby={`app-title-${app.title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Card p="3" borderRadius="lg">
        <AppIcon app={app} size="10" />
      </Card>
      <Flex direction="column" gap="2" py="2">
        <Heading size="md" id={`app-title-${app.title.toLowerCase().replace(/\s+/g, "-")}`}>
          {app.isExternal && typeof app.to === "string" ? (
            <HoverLinkOverlay href={app.to} isExternal onClick={onClick} aria-label={`${app.title} (opens in new tab)`}>
              {app.title}
            </HoverLinkOverlay>
          ) : (
            <HoverLinkOverlay as={RouterLink} to={app.to} onClick={onClick} aria-label={`${app.title}`}>
              {app.title}
            </HoverLinkOverlay>
          )}
        </Heading>
        <Text aria-label={app.description}>{app.description}</Text>
      </Flex>

      {canFavorite && <AppFavoriteButton app={app} variant="ghost" ms="auto" my="2" mr="2" zIndex={1} />}
    </Flex>
  );
}
