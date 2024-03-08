import { useMemo } from "react";
import dnsIdentityService from "../services/dns-identity";
import useSubject from "./use-subject";

export default function useDnsIdentity(address: string | undefined) {
  const subject = useMemo(() => {
    if (address) return dnsIdentityService.getIdentity(address);
  }, [address]);

  return useSubject(subject);
}
