import { useAsync } from "react-use";
import useUserProfile from "./use-user-profile";
import lnurlMetadataService from "../services/lnurl-metadata";

export default function useUserLNURLMetadata(pubkey: string) {
  const userMetadata = useUserProfile(pubkey);
  const address = userMetadata?.lud16 || userMetadata?.lud06;
  const { value: metadata } = useAsync(
    async () => (address ? lnurlMetadataService.requestMetadata(address) : undefined),
    [address],
  );

  return { metadata, address };
}
