import { Divider, Flex, Link, Spacer, Text } from "@chakra-ui/react";

import {
  AppearanceIcon,
  DatabaseIcon,
  GithubIcon,
  LightningIcon,
  NotesIcon,
  PerformanceIcon,
  RelayIcon,
  SearchIcon,
  SpyIcon,
  VerifiedIcon,
} from "../../components/icons";
import { useActiveAccount } from "applesauce-react/hooks";
import Image01 from "../../components/icons/image-01";
import UserAvatar from "../../components/user/user-avatar";
import VersionButton from "../../components/version-button";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";
import Database01 from "../../components/icons/database-01";
import Mail02 from "../../components/icons/mail-02";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import CheckCircleBroken from "../../components/icons/check-circle-broken";

function DividerHeader({ title }: { title: string }) {
  return (
    <Flex alignItems="center" gap="2">
      <Divider />
      <Text fontWeight="bold" fontSize="md">
        {title}
      </Text>
      <Divider />
    </Flex>
  );
}

export default function SettingsView() {
  const account = useActiveAccount();

  return (
    <SimpleParentView title="Settings" path="/settings">
      {account && (
        <>
          <SimpleNavItem to="/settings/accounts" leftIcon={<UserAvatar size="xs" pubkey={account.pubkey} />}>
            Accounts
          </SimpleNavItem>
          <SimpleNavItem to="/settings/mailboxes" leftIcon={<Mail02 boxSize={6} />}>
            Mailboxes
          </SimpleNavItem>
          <SimpleNavItem to="/settings/media-servers" leftIcon={<Image01 boxSize={6} />}>
            Media Servers
          </SimpleNavItem>
          <SimpleNavItem to="/settings/search-relays" leftIcon={<SearchIcon boxSize={6} />}>
            Search
          </SimpleNavItem>
          <SimpleNavItem to="/settings/identity" leftIcon={<VerifiedIcon boxSize={6} />}>
            DNS Identity
          </SimpleNavItem>
        </>
      )}

      <DividerHeader title="App" />
      <SimpleNavItem to="/settings/display" leftIcon={<AppearanceIcon boxSize={5} />}>
        Display
      </SimpleNavItem>
      <SimpleNavItem to="/settings/relays" leftIcon={<RelayIcon boxSize={5} />}>
        Relays
      </SimpleNavItem>
      <SimpleNavItem to="/settings/authentication" leftIcon={<CheckCircleBroken boxSize={5} />}>
        Authentication
      </SimpleNavItem>
      <SimpleNavItem to="/settings/cache" leftIcon={<Database01 boxSize={5} />}>
        Cache
      </SimpleNavItem>
      <SimpleNavItem to="/settings/post" leftIcon={<NotesIcon boxSize={5} />}>
        Posts
      </SimpleNavItem>
      <SimpleNavItem to="/settings/performance" leftIcon={<PerformanceIcon boxSize={5} />}>
        Performance
      </SimpleNavItem>
      <SimpleNavItem to="/settings/lightning" leftIcon={<LightningIcon boxSize={5} />}>
        Lightning
      </SimpleNavItem>
      <SimpleNavItem to="/settings/privacy" leftIcon={<SpyIcon boxSize={5} />}>
        Privacy
      </SimpleNavItem>
      <SimpleNavItem to="/relays/cache/database" leftIcon={<DatabaseIcon boxSize={5} />}>
        Database Tools
      </SimpleNavItem>

      <Flex alignItems="center">
        <Link isExternal href="https://github.com/hzrd149/nostrudel">
          <GithubIcon /> Github
        </Link>
        <Spacer />
        <VersionButton />
      </Flex>
    </SimpleParentView>
  );
}
