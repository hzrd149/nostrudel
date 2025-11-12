import { Box, Flex, FlexProps, LinkBox, Text } from "@chakra-ui/react";
import { forwardRef, ReactNode } from "react";
import { Link as RouterLink, To } from "react-router-dom";

import HoverLinkOverlay from "../../hover-link-overlay";
import Timestamp from "../../timestamp";

export interface SimpleBoxLayoutProps extends Omit<FlexProps, "children" | "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  to?: To;
  href?: string;
  timestamp?: number | ReactNode;
}

const SimpleNavBox = forwardRef<HTMLDivElement, SimpleBoxLayoutProps>(
  (
    { icon, title, description, metadata, footer, actions, to, href, timestamp, ...props }: SimpleBoxLayoutProps,
    ref,
  ) => {
    return (
      <Flex as={LinkBox} gap="4" px="4" py="2" borderBottomWidth={1} overflow="hidden" ref={ref} {...props}>
        {icon && <Box flexShrink={0}>{icon}</Box>}

        <Flex direction="column" gap="2" flex={1} overflow="hidden">
          <Box overflow="hidden">
            <Flex alignItems="center" overflow="hidden">
              <Text fontWeight="bold">
                {href ? (
                  <HoverLinkOverlay href={href} isExternal>
                    {title}
                  </HoverLinkOverlay>
                ) : to ? (
                  <HoverLinkOverlay as={RouterLink} to={to}>
                    {title}
                  </HoverLinkOverlay>
                ) : (
                  title
                )}
              </Text>

              {timestamp && (
                <Text fontSize="sm" color="GrayText" ms="auto" whiteSpace="pre">
                  {typeof timestamp === "number" ? <Timestamp timestamp={timestamp} /> : timestamp}
                </Text>
              )}
            </Flex>

            {description && (
              <Text noOfLines={2} fontSize="sm" color="GrayText">
                {description}
              </Text>
            )}
          </Box>

          {metadata && <Box>{metadata}</Box>}
          {footer && <Box>{footer}</Box>}
        </Flex>

        {actions && (
          <Box flexShrink={0} zIndex={1}>
            {actions}
          </Box>
        )}
      </Flex>
    );
  },
);

export default SimpleNavBox;
