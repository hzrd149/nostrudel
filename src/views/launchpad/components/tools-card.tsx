import { useState } from "react";
import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Input, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useRecentIds from "../../../hooks/use-recent-ids";
import { allApps, App } from "../../../components/navigation/apps";
import SimpleNavBox from "../../../components/layout/box-layout/simple-nav-box";
import { AppIcon } from "../../other-stuff/component/app-card";
import AppFavoriteButton from "../../../components/navigation/app-favorite-button";

function ToolItem({ app, onClick }: { app: App; onClick?: () => void }) {
  return (
    <SimpleNavBox
      icon={<AppIcon app={app} size="10" />}
      title={app.title}
      description={app.description}
      to={app.isExternal ? undefined : app.to}
      href={app.isExternal && typeof app.to === "string" ? app.to : undefined}
      onClick={onClick}
      actions={<AppFavoriteButton app={app} variant="ghost" />}
    />
  );
}

export default function ToolsCard({ ...props }: Omit<CardProps, "children">) {
  const { recent: recentApps, useThing: useApp } = useRecentIds("apps");

  const apps = Array(6)
    .fill(0)
    .map((_, i) => {
      if (recentApps[i]) {
        return allApps.find((a) => a.id === recentApps[i]) || allApps[i];
      } else return allApps[i];
    });

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="md">
          <Link as={RouterLink} to="/other-stuff">
            Tools
          </Link>
        </Heading>
      </CardHeader>
      <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
        {apps.map((app) => (
          <ToolItem key={app.id} app={app} onClick={() => useApp(app.id)} />
        ))}
        <Button as={RouterLink} to="/other-stuff" w="full" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}
