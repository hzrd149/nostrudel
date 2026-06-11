import { useAsync } from "react-use";
import { Identity } from "applesauce-loaders/helpers/dns-identity";

import { isNamecoinIdentifier, resolveNamecoin, toIdentity } from "../services/namecoin";

/**
 * React hook to resolve a Namecoin NIP-05 identity (.bit / d/ / id/).
 * Returns an applesauce Identity object compatible with existing UI.
 */
export default function useNamecoinIdentity(address: string | undefined): Identity | undefined {
  const isNmc = address ? isNamecoinIdentifier(address) : false;

  const { value: identity } = useAsync(async () => {
    if (!address || !isNmc) return undefined;
    try {
      const result = await resolveNamecoin(address);
      return toIdentity(address, result);
    } catch (err) {
      return toIdentity(address, null, err instanceof Error ? err.message : "Unknown error");
    }
  }, [address, isNmc]);

  return identity;
}
