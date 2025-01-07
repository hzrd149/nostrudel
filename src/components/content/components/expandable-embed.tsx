import { PropsWithChildren, ReactNode } from "react";
import EmbedActions from "./embed-actions";
import { Link, useDisclosure } from "@chakra-ui/react";

import useAppSettings from "../../../hooks/use-user-app-settings";

export default function ExpandableEmbed({
  children,
  label,
  url,
  urls,
  hideOnDefaultOpen,
  actions,
}: PropsWithChildren<{
  label: string;
  url?: string | URL;
  urls?: string[] | URL[];
  hideOnDefaultOpen?: boolean;
  actions?: ReactNode;
}>) {
  const { autoShowMedia } = useAppSettings();
  const expanded = useDisclosure({ defaultIsOpen: autoShowMedia });
  const showActions = hideOnDefaultOpen && autoShowMedia ? false : true;

  return (
    <>
      {showActions && (
        <EmbedActions
          open={expanded.isOpen}
          onToggle={expanded.onToggle}
          url={url}
          label={label}
          display="flex"
          mt="2"
          mb="1"
        >
          {actions}
        </EmbedActions>
      )}
      {expanded.isOpen
        ? children
        : urls
          ? urls.map((url) => (
              <Link key={url.toString()} color="blue.500" href={url.toString()} isExternal noOfLines={1}>
                {url.toString()}
              </Link>
            ))
          : url && (
              <Link color="blue.500" href={url.toString()} isExternal noOfLines={1}>
                {url.toString()}
              </Link>
            )}
    </>
  );
}
