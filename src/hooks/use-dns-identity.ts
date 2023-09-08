import dnsIdentityService from "../services/dns-identity";
import { useMemo } from "react";
import useSubject from "./use-subject";

export function useDnsIdentity(address: string | undefined) {
  const subject = useMemo(() => {
    if (address) return dnsIdentityService.getIdentity(address);
  }, [address]);

  return useSubject(subject);
}
