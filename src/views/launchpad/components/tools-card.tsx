import { useState } from "react";
import { Button, Card, CardBody, CardHeader, CardProps, Heading, Input, Link, SimpleGrid } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useRecentIds from "../../../hooks/use-recent-ids";
import { allApps } from "../../../components/navigation/apps";
import AppCard from "../../other-stuff/component/app-card";

export default function ToolsCard({ ...props }: Omit<CardProps, "children">) {
  const { recent: recentApps, useThing: useApp } = useRecentIds("apps");

  const [search, setSearch] = useState("");

  const apps = Array(6)
    .fill(0)
    .map((_, i) => {
      if (recentApps[i]) {
        return allApps.find((a) => a.id === recentApps[i]) || allApps[i];
      } else return allApps[i];
    });

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center" pb="2">
        <Heading size="lg">
          <Link as={RouterLink} to="/other-stuff">
            Tools
          </Link>
        </Heading>

        <Input
          type="search"
          placeholder="Search apps"
          maxW="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardBody overflowX="hidden" overflowY="auto" pt="4" display="flex" gap="2" flexDirection="column" maxH="50vh">
        <SimpleGrid spacing="2" columns={{ base: 1, md: 2 }}>
          {search.length > 2
            ? allApps
                .filter(
                  (app) =>
                    app.title.toLowerCase().includes(search.toLowerCase()) ||
                    app.description.toLowerCase().includes(search.toLowerCase()),
                )
                .map((app) => <AppCard key={app.id} app={app} onClick={() => useApp(app.id)} />)
            : apps.map((app) => <AppCard key={app.id} app={app} onClick={() => useApp(app.id)} />)}
        </SimpleGrid>
        <Button as={RouterLink} to="/other-stuff" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}
