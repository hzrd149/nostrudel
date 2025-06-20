import { PropsWithChildren, ReactNode } from "react";
import EmbedActions from "./embed-actions";
import { Link, useDisclosure } from "@chakra-ui/react";

import OpenGraphCard from "../../open-graph/open-graph-card";
import { useContentSettings } from "../../../providers/local/content-settings";

export default function ExpandableEmbed({
  children,
  label,
  url,
  raw,
  hideOnDefaultOpen,
  actions,
  card,
}: PropsWithChildren<{
  label: string;
  url?: string | URL;
  hideOnDefaultOpen?: boolean;
  actions?: ReactNode;
  raw?: ReactNode;
  card?: boolean;
}>) {
  const { hideEmbeds } = useContentSettings();
  const expanded = useDisclosure({ defaultIsOpen: !hideEmbeds });
  const showActions = hideOnDefaultOpen && !hideEmbeds ? false : true;

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
        : raw ||
          (url &&
            (card ? (
              <OpenGraphCard url={new URL(url)} />
            ) : (
              <Link color="blue.500" href={url.toString()} isExternal>
                {url.toString()}
              </Link>
            )))}
    </>
  );
}
