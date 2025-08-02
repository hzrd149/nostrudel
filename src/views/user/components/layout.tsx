import { ComponentWithAs, Flex, FlexProps, IconButton, IconProps, useDisclosure } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import {
  Button,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { nprofileEncode, npubEncode, ProfilePointer } from "nostr-tools/nip19";
import { ErrorBoundary } from "../../../components/error-boundary";
import {
  AddReactionIcon,
  ArticleIcon,
  DownloadIcon,
  EmojiPacksIcon,
  ErrorIcon,
  FollowIcon,
  GoalIcon,
  LightningIcon,
  ListsIcon,
  LiveStreamIcon,
  MediaIcon,
  MuteIcon,
  NotesIcon,
  ProfileIcon,
  RelayIcon,
  TorrentIcon,
  FollowIcon as UserPlus01Icon,
  VideoIcon,
} from "../../../components/icons";
import { SettingsIcon } from "../../../components/icons";
import DotsGrid from "../../../components/icons/dots-grid";
import SimpleHeader from "../../../components/layout/presets/simple-header";
import RouterLink from "../../../components/router-link";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";

const tabs: { label: string; path: string; icon: ComponentWithAs<"svg", IconProps> }[] = [
  { label: "About", path: "", icon: ProfileIcon },
  { label: "Notes", path: "notes", icon: NotesIcon },
  { label: "Articles", path: "articles", icon: ArticleIcon },
  { label: "Streams", path: "streams", icon: LiveStreamIcon },
  { label: "Media", path: "media", icon: MediaIcon },
  { label: "Zaps", path: "zaps", icon: LightningIcon },
  { label: "Lists", path: "lists", icon: ListsIcon },
  { label: "Following", path: "following", icon: FollowIcon },
  { label: "Reactions", path: "reactions", icon: AddReactionIcon },
  { label: "Relays", path: "relays", icon: RelayIcon },
  { label: "Goals", path: "goals", icon: GoalIcon },
  { label: "Videos", path: "videos", icon: VideoIcon },
  { label: "Files", path: "files", icon: DownloadIcon },
  { label: "Emojis", path: "emojis", icon: EmojiPacksIcon },
  { label: "Torrents", path: "torrents", icon: TorrentIcon },
  { label: "Reports", path: "reports", icon: ErrorIcon },
  { label: "Followers", path: "followers", icon: UserPlus01Icon },
  { label: "Muted by", path: "muted-by", icon: MuteIcon },
  { label: "Advanced", path: "advanced", icon: SettingsIcon },
];

export function UserLayoutTabs({ user, ...props }: { user: ProfilePointer } & Omit<FlexProps, "children">) {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get the current tab from the last segment of the path
  const pathSegments = location.pathname.split("/");
  const basePath = pathSegments.slice(0, 3).join("/") + "/";
  const currentPath = pathSegments[3] || "";

  return (
    <>
      <Flex gap="2" borderBottom="1px solid var(--chakra-colors-chakra-border-color)" {...props}>
        {/* First tab - square button that opens modal */}
        <IconButton
          icon={<DotsGrid boxSize={5} />}
          onClick={onOpen}
          variant="ghost"
          size="sm"
          flexShrink={0}
          aria-label="Select view"
          my="2"
          ml="2"
        />

        <Flex
          py="2"
          pr="2"
          overflowX="auto"
          overflowY="hidden"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          gap="2"
          alignItems="center"
        >
          {/* Current tab button */}
          {tabs.map((tab) => (
            <Button
              key={tab.path}
              as={RouterLink}
              to={basePath + tab.path}
              size="sm"
              variant={tab.path === currentPath ? "solid" : "ghost"}
              colorScheme={tab.path === currentPath ? "primary" : undefined}
              flexShrink={0}
            >
              <tab.icon boxSize={4} mr="1" />
              {tab.label}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Modal with all available tabs */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px={4} pt={4} pb={2}>
            Select View
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={2} pb={2} pt={0}>
            <Grid templateColumns="repeat(3, 1fr)" gap={3}>
              {tabs.map((tab) => (
                <GridItem key={tab.path}>
                  <Button
                    as={RouterLink}
                    to={basePath + tab.path}
                    w="full"
                    h="20"
                    variant={tab.path === currentPath ? "solid" : "outline"}
                    colorScheme={tab.path === currentPath ? "primary" : "gray"}
                    fontSize="sm"
                    textAlign="center"
                    whiteSpace="normal"
                    wordBreak="break-word"
                    flexDirection="row"
                    gap={2}
                  >
                    <tab.icon boxSize={6} />
                    {tab.label}
                  </Button>
                </GridItem>
              ))}
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function UserLayout({
  children,
  actions,
  as,
  flush,
  gap,
  maxW,
  center,
  scroll = true,
  title,
  ...props
}: Omit<FlexProps, "title"> & {
  flush?: boolean;
  actions?: ReactNode;
  center?: boolean;
  scroll?: boolean;
  title?: ReactNode;
}) {
  const user = useParamsProfilePointer("pubkey");
  const ref = useScrollRestoreRef();
  const location = useLocation();

  // Get the current tab from the last segment of the path
  const pathSegments = location.pathname.split("/");

  const content = (
    <Flex
      direction="column"
      px={flush ? 0 : "4"}
      pt={flush ? 0 : "4"}
      pb={flush ? 0 : "max(1rem, var(--safe-bottom))"}
      gap={gap || "2"}
      flexGrow={1}
      maxW={maxW}
      w={maxW ? "full" : "initial"}
      mx={center ? "auto" : undefined}
    >
      {children}
    </Flex>
  );

  return (
    <Flex
      data-type="user-layout"
      as={as}
      flex={1}
      direction="column"
      pr="var(--safe-right)"
      pl="var(--safe-left)"
      overflow="hidden"
      {...props}
    >
      <SimpleHeader
        title={
          <Flex alignItems="center" gap="2">
            <UserLink pubkey={user.pubkey} />
            {title}
          </Flex>
        }
        icon={<UserAvatar pubkey={user.pubkey} size="sm" />}
      >
        {actions}
      </SimpleHeader>

      {/* Horizontal scrollable tab bar */}
      <UserLayoutTabs user={user} />

      <ErrorBoundary>
        {scroll ? (
          <Flex flex={1} overflowY="auto" overflowX="hidden" direction="column" ref={ref}>
            {content}
          </Flex>
        ) : (
          content
        )}
      </ErrorBoundary>
    </Flex>
  );
}
