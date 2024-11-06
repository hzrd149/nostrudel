import { useMemo } from "react";
import { useObservable } from "applesauce-react/hooks";

import dnsIdentityService from "../services/dns-identity";

export default function useDnsIdentity(address: string | undefined) {
  const subject = useMemo(() => {
    if (!address) return;
    const addr = getCleanNip05(address);
    return dnsIdentityService.getIdentity(addr);
  }, [address]);

  return useObservable(subject);
}

// takes in a Nostr address and "cleans" it. cleaning involves checking if the
// address starts with an underscore, getting the domain name minus the TLD,
// and replacing the underscore with the domain name minus the TLD.
// example: _@bob.com -> bob@bob.com
function getCleanNip05(address: string): string {
  if (!address.startsWith("_")) {
    return address;
  }

  const addr_split = address.split("@");
  if (addr_split.length != 2) {
    return address;
  }

  const domain_split = addr_split[1].split(".");
  if (domain_split.length < 2) {
    return address;
  }

  const domain_name = domain_split[0];
  return `${domain_name}@${addr_split[1]}`;
}
