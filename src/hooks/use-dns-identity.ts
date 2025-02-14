import { useAsync } from "react-use";
import { parseNIP05Address } from "applesauce-core/helpers";

import dnsIdentityLoader from "../services/dns-identity-loader";
import SuperMap from "../classes/super-map";

const parseCache = new SuperMap<string, { name: string; domain: string } | null>(parseNIP05Address);

export default function useDnsIdentity(address: string | undefined) {
  const parsed = address ? parseCache.get(address) : null;
  const { value: identity } = useAsync(async () => {
    if (parsed) return await dnsIdentityLoader.requestIdentity(parsed.name, parsed.domain);
  }, [parsed?.name, parsed?.domain]);

  return identity;
}
