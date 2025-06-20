import { Button, ButtonProps, Link, useDisclosure } from "@chakra-ui/react";
import { Link as NastLink } from "applesauce-content/nast";

import { useMediaOwnerContext } from "../../../providers/local/media-owner";
import { BlobDetailsModal } from "../../blob-details-modal";
import OpenGraphCard from "../../open-graph/open-graph-card";
import OpenGraphLink from "../../open-graph/open-graph-link";

export function renderGenericUrl(match: URL) {
  return (
    <Link href={match.toString()} isExternal color="blue.500">
      {match.protocol +
        "//" +
        match.host +
        match.pathname +
        (match.search && match.search.length < 120 ? match.search : "") +
        (match.hash.length < 96 ? match.hash : "")}
    </Link>
  );
}

export function renderOpenGraphUrl(match: URL, node: NastLink) {
  return node.data?.eol ? <OpenGraphCard url={match} /> : <OpenGraphLink url={match} />;
}

export function BlobDetailsButton({
  src,
  original,
  ...props
}: { src: URL; original: string } & Omit<ButtonProps, "children" | "onClick">) {
  const modal = useDisclosure();
  const owner = useMediaOwnerContext();

  if (!owner) return null;

  return (
    <>
      <Button onClick={modal.onOpen} {...props}>
        [ Details ]
      </Button>
      {modal.isOpen && (
        <BlobDetailsModal
          url={src.toString()}
          hash={original}
          pubkey={owner}
          isOpen={modal.isOpen}
          onClose={modal.onClose}
          size="2xl"
        />
      )}
    </>
  );
}
