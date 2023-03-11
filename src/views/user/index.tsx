import { Flex, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { Outlet, useLoaderData, useMatches, useNavigate } from "react-router-dom";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { useAppTitle } from "../../hooks/use-app-title";
import Header from "./components/header";
import { Suspense } from "react";

const tabs = [
  { label: "Notes", path: "notes" },
  { label: "Zaps", path: "zaps" },
  { label: "Followers", path: "followers" },
  { label: "Following", path: "following" },
  { label: "Relays", path: "relays" },
  { label: "Reports", path: "reports" },
];

const UserView = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { pubkey } = useLoaderData() as { pubkey: string };

  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  const activeTab = tabs.indexOf(tabs.find((t) => lastMatch.pathname.includes(t.path)) ?? tabs[0]);

  const metadata = useUserMetadata(pubkey, [], true);
  const npub = normalizeToBech32(pubkey, Bech32Prefix.Pubkey);

  useAppTitle(getUserDisplayName(metadata, npub ?? pubkey));

  return (
    <Flex direction="column" alignItems="stretch" gap="2" overflow={isMobile ? "auto" : "hidden"} height="100%">
      {/* {metadata?.banner && <Image src={metadata.banner} />} */}
      <Header pubkey={pubkey} />
      <Tabs
        display="flex"
        flexDirection="column"
        flexGrow="1"
        overflow={isMobile ? undefined : "hidden"}
        isLazy
        index={activeTab}
        onChange={(v) => navigate(tabs[v].path)}
      >
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          {tabs.map(({ label }) => (
            <Tab key={label}>{label}</Tab>
          ))}
        </TabList>

        <TabPanels overflow={isMobile ? undefined : "auto"} height="100%">
          {tabs.map(({ label }) => (
            <TabPanel key={label} pr={0} pl={0}>
              <Suspense fallback={<Spinner />}>
                <Outlet context={{ pubkey }} />
              </Suspense>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default UserView;
