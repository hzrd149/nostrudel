import { Link, LinkProps } from "@chakra-ui/react";

import RouterLink from "../router-link";
import RelayName from "./relay-name";

export type RelyLinkProps = Omit<LinkProps, "children"> & {
  relay: string;
};

export default function RelayLink({ relay, ...props }: RelyLinkProps) {
  return (
    <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} whiteSpace="nowrap" {...props}>
      <RelayName relay={relay} />
    </Link>
  );
}
