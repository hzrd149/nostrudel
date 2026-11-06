import { createResourceService as createReferenceResourceService } from "@kehto/services";
import { createResourceResolver, MAX_RESOURCE_BYTES, type ResourceResolverOptions } from "./resource-resolver";

export type ResourceServiceOptions = ResourceResolverOptions;

/** The reference router owns per-item batches, cancellation and teardown; the resolver owns policy. */
export function createResourceService(options: ResourceServiceOptions) {
  return createReferenceResourceService({
    fetch: createResourceResolver(options),
    resourceInfo: {
      schemes: ["nostr", "https", "blossom"].map((scheme) => ({ scheme, enabled: true })),
      maxBytes: MAX_RESOURCE_BYTES,
      maxUrls: 16,
      maxServers: 8,
    },
  });
}
