import {
  Button,
  Card,
  CardHeader,
  ComponentWithAs,
  Flex,
  Heading,
  IconProps,
  Image,
  Link,
  LinkBox,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { DirectMessagesIcon, ExternalLinkIcon, LiveStreamIcon, MapIcon, MuteIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import ShieldOff from "../../components/icons/shield-off";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import Users01 from "../../components/icons/users-01";
import PackageSearch from "../../components/icons/package-search";

function InternalLink({
  to,
  icon: Icon,
  children,
}: {
  to?: string;
  icon: ComponentWithAs<"svg", IconProps>;
  children: string;
}) {
  return (
    <Card as={LinkBox} alignItems="center" p="4" gap="4" minW="40">
      <Icon boxSize={10} />
      <CardHeader p="0">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={to}>
            {children}
          </HoverLinkOverlay>
        </Heading>
      </CardHeader>
    </Card>
  );
}

function ExternalLink({ href, image, children }: { href?: string; image: string; children: string }) {
  return (
    <Card as={LinkBox} alignItems="center" p="4" gap="4" minW="40">
      <Image src={image} h="10" />
      <CardHeader p="0">
        <Heading size="md">
          <HoverLinkOverlay as={Link} href={href} isExternal>
            {children}
          </HoverLinkOverlay>
        </Heading>
      </CardHeader>
    </Card>
  );
}
export default function ToolsHomeView() {
  return (
    <VerticalPageLayout>
      <Heading>Tools</Heading>
      <Flex wrap="wrap" gap="4">
        <InternalLink to="/tools/content-discovery" icon={PackageSearch}>
          Discovery DVM
        </InternalLink>
        <InternalLink to="/tools/network" icon={Users01}>
          User Network
        </InternalLink>
        <InternalLink to="/tools/network-mute-graph" icon={MuteIcon}>
          Mute Graph
        </InternalLink>
        <InternalLink to="/tools/network-dm-graph" icon={DirectMessagesIcon}>
          DM Graph
        </InternalLink>
        <InternalLink to="/tools/dm-feed" icon={ShieldOff}>
          DM Feed
        </InternalLink>
        <InternalLink to="/map" icon={MapIcon}>
          Map
        </InternalLink>
        <InternalLink to="/tools/stream-moderation" icon={LiveStreamIcon}>
          Stream Moderation
        </InternalLink>
      </Flex>

      <Heading size="lg" mt="4">
        Third party tools
      </Heading>
      <Flex wrap="wrap" gap="4">
        <ExternalLink href="https://w3.do/" image="https://w3.do/favicon.ico">
          URL Shortener
        </ExternalLink>
        <ExternalLink href="https://nak.nostr.com/" image="https://nak.nostr.com/favicon.ico">
          nostr army knife
        </ExternalLink>
        <ExternalLink href="https://nostr-delete.vercel.app/" image="https://nostr-delete.vercel.app/favicon.png">
          Nostr Event Deletion
        </ExternalLink>
        <ExternalLink href="https://nostrdebug.com/" image="https://nostrdebug.com/favicon.ico">
          Nostr Debug
        </ExternalLink>
        <ExternalLink href="https://metadata.nostr.com/" image="https://metadata.nostr.com/img/git.png">
          Nostr Profile Manager
        </ExternalLink>
        <ExternalLink
          href="https://www.nostrapps.com/"
          image="https://uploads-ssl.webflow.com/641d0d46d5c124ac928a6027/64b1dd06d59d8f1e530d2926_32x32.png"
        >
          Nostr Apps
        </ExternalLink>
      </Flex>
    </VerticalPageLayout>
  );
}
