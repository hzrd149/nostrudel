import { useState } from "react";
import { ButtonGroup, Flex, FlexProps, IconButton } from "@chakra-ui/react";

import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";
import NavItems from "../components";
import useRootPadding from "../../../hooks/use-root-padding";
import AccountSwitcher from "../components/account-switcher";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";

export default function DesktopSideNav({ ...props }: Omit<FlexProps, "children">) {
  const [collapsed, setCollapsed] = useState(false);

  useRootPadding({ left: collapsed ? "var(--chakra-sizes-16)" : "var(--chakra-sizes-64)" });

  return (
    <CollapsedContext.Provider value={collapsed}>
      <Flex
        direction="column"
        gap="2"
        px="2"
        py="2"
        shrink={0}
        borderRightWidth={1}
        pt="calc(var(--chakra-space-2) + var(--safe-top))"
        pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
        w={collapsed ? "16" : "64"}
        position="fixed"
        left="0"
        bottom="0"
        top="0"
        zIndex="modal"
        overflowY="auto"
        overflowX="hidden"
        overscroll="none"
        {...props}
      >
        <AccountSwitcher />
        <NavItems />
        <ButtonGroup variant="ghost">
          <IconButton
            aria-label={collapsed ? "Open" : "Close"}
            title={collapsed ? "Open" : "Close"}
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <ChevronRightIcon boxSize={6} /> : <ChevronLeftIcon boxSize={6} />}
          />
          {!collapsed && (
            <>
              <RelayConnectionButton w="full" />
              <PublishLogButton flexShrink={0} />
            </>
          )}
        </ButtonGroup>
      </Flex>
    </CollapsedContext.Provider>
  );
}
