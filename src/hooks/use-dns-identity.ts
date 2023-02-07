import { useAsync } from "react-use";
import dnsIdentityService from "../services/dns-identity";

export function useDnsIdentity(address: string | undefined) {
  const { value, loading, error } = useAsync(async () => {
    if (!address) return;
    return dnsIdentityService.getIdentity(address);
  }, [address]);

  return {
    identity: value,
    error,
    loading,
  };
}
