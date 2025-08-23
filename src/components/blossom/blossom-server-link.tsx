import { Link, LinkProps } from "@chakra-ui/react";

import RouterLink from "../router-link";

export type BlossomServerLinkProps = Omit<LinkProps, "children"> & {
  server: string | URL;
};

export default function BlossomServerLink({ server, ...props }: BlossomServerLinkProps) {
  return (
    <Link as={RouterLink} to={`/blossom/${encodeURIComponent(String(server))}`} whiteSpace="nowrap" {...props}>
      {new URL(server).hostname}
    </Link>
  );
}
