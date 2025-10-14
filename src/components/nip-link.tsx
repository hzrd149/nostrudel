import { Link, LinkProps } from "@chakra-ui/react";

export default function NipLink({ nip, children, ...props }: { nip: number | string } & Omit<LinkProps, "href">) {
  const str = typeof nip === "number" ? (nip < 10 ? `0${nip}` : String(nip)) : nip;

  return (
    <Link isExternal href={`https://nips.nostr.com/${str}`} {...props}>
      {children || `NIP-${str}`}
    </Link>
  );
}
