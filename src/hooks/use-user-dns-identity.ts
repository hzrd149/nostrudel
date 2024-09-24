import useDnsIdentity from "./use-dns-identity";
import useUserProfile from "./use-user-profile";

export function useUserDNSIdentity(pubkey?: string) {
  const metadata = useUserProfile(pubkey);
  return useDnsIdentity(metadata?.nip05);
}
