import { useDnsIdentity } from "./use-dns-identity";
import { useUserMetadata } from "./use-user-metadata";

export function useUserDNSIdentity(pubkey?: string) {
  const metadata = useUserMetadata(pubkey);
  return useDnsIdentity(metadata?.nip05);
}
