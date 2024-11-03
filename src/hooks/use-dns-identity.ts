import { useMemo } from "react";
import { useObservable } from "applesauce-react/hooks";

import dnsIdentityService from "../services/dns-identity";

export default function useDnsIdentity(address: string | undefined) {
  const subject = useMemo(() => {
    if (address) return dnsIdentityService.getIdentity(address);
  }, [address]);

  return useObservable(subject);
}
