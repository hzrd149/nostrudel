import { Query } from "applesauce-core";
import { getProfileContent, ProfileContent } from "applesauce-core/helpers";
import { map } from "rxjs/operators";
import { kinds } from "nostr-tools";

export function UserProfilesQuery(pubkeys: string[]): Query<Record<string, ProfileContent>> {
  return (store) =>
    store.timeline([{ kinds: [kinds.Metadata], authors: pubkeys }]).pipe(
      map((events) => {
        const profiles: Record<string, ProfileContent> = {};

        for (const event of events) {
          try {
            profiles[event.pubkey] = getProfileContent(event);
          } catch (err) {}
        }

        return profiles;
      }),
    );
}
