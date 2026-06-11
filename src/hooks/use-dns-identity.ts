import { useAsync } from "react-use";
import { parseNIP05Address } from "applesauce-core/helpers/dns-identity";
import { Identity } from "applesauce-loaders/helpers/dns-identity";

import dnsIdentityLoader from "../services/dns-identity-loader";
import SuperMap from "../classes/super-map";
import { isNamecoinIdentifier, resolveNamecoin, toIdentity } from "../services/namecoin";

const parseCache = new SuperMap<string, { name: string; domain: string } | null>(parseNIP05Address);

export default function useDnsIdentity(address: string | undefined, force = false): Identity | undefined {
  const isNmc = address ? isNamecoinIdentifier(address) : false;
  const parsed = address && !isNmc ? parseCache.get(address) : null;

  const { value: identity } = useAsync(async () => {
    if (!address) return undefined;

    // Route .bit / d/ / id/ identifiers to the Namecoin resolver
    if (isNmc) {
      try {
        const result = await resolveNamecoin(address);
        return toIdentity(address, result);
      } catch (err) {
        return toIdentity(address, null, err instanceof Error ? err.message : "Unknown error");
      }
    }

    // Standard NIP-05 resolution
    if (parsed) return await dnsIdentityLoader.requestIdentity(parsed.name, parsed.domain);
    return undefined;
  }, [address, isNmc, parsed?.name, parsed?.domain]);

  return identity;
}
