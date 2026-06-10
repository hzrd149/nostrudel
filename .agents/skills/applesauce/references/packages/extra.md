# Applesauce Extra

A collection of stuff that doesn't fit into any applesauce package.

## PrimalCache

Extended relay interface for Primal's caching server. Provides access to Primal's enhanced API endpoints for content discovery, user recommendations, trending hashtags, notifications, and more. Includes methods for:

- Content exploration and scoring
- User search and recommendations
- Trending hashtags and images
- Notification management
- Advanced search and feeds
- Media metadata retrieval

**Code:** [`src/primal.ts`](src/primal.ts)
**Upstream:** [PrimalHQ/primal-server](https://github.com/PrimalHQ/primal-server)

## Vertex

Extended relay interface for the Vertex relay (relay.vertexlab.io). Provides reputation-based user discovery and verification services. Includes methods for:

- Profile lookup with reputation scoring
- Reputation verification
- Credit balance checking
- Automatic authentication handling

**Code:** [`src/vertex.ts`](src/vertex.ts)
**Upstream:** [vertexlab.io](https://vertexlab.io/docs/services/)
