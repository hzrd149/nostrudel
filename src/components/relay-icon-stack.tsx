import {
  AvatarProps,
  Flex,
  FlexProps,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "@chakra-ui/react";

import RelayFavicon from "./relay/relay-favicon";
import RelayLink from "./relay/relay-link";

export type RelayIconStackProps = { relays: string[]; title?: string; size?: AvatarProps["size"] } & Omit<
  FlexProps,
  "children"
>;

export function RelayIconStack({ title, relays, size = "xs", ...props }: RelayIconStackProps) {
  return (
    <>
      <Popover isLazy>
        <PopoverTrigger>
          <Flex
            alignItems="center"
            gap="-4"
            overflow="hidden"
            cursor="pointer"
            role="button"
            tabIndex={0}
            aria-label="View relay information"
            {...props}
          >
            {relays.map((url) => (
              <RelayFavicon key={url} relay={url} size={size} />
            ))}
          </Flex>
        </PopoverTrigger>
        <PopoverContent>
          {title && <PopoverHeader>{title}</PopoverHeader>}
          <PopoverBody display="flex" flexDirection="column" gap="1">
            {relays &&
              Array.from(relays).map((relay) => (
                <Flex key={relay} alignItems="center" gap="2">
                  <RelayFavicon relay={relay} size="xs" />
                  <RelayLink relay={relay} isTruncated />
                </Flex>
              ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
}
