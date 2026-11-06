import { Box, BoxProps } from "@chakra-ui/react";
import { blossomURIs, links, nostrMentions } from "applesauce-content/text";
import { useRenderedContent } from "applesauce-react/hooks";

import useUserProfile from "../../hooks/use-user-profile";
import { BlossomContentLink } from "../content/components/blossom";
import { components } from "../content";
import { NostrMentionLink } from "../content/components/mention";
import { renderGenericUrl } from "../content/links";
import { ProfileContent } from "applesauce-core/helpers";

const aboutComponents = {
  ...components,
  blossom: BlossomContentLink,
  mention: NostrMentionLink,
};
const transformers = [blossomURIs, links, nostrMentions];
const linkRenderers = [renderGenericUrl];

const ProfileAboutContentSymbol = Symbol.for("profile-about-content");

export default function UserAboutContent({
  pubkey,
  profile,
  ...props
}: { pubkey?: string; profile?: ProfileContent } & Omit<BoxProps, "children">) {
  const loadedProfile = useUserProfile(profile ? undefined : pubkey);
  profile = profile || loadedProfile;

  const content = useRenderedContent(profile?.about, aboutComponents, {
    transformers,
    linkRenderers,
    cacheKey: ProfileAboutContentSymbol,
  });

  return (
    <Box whiteSpace="pre-line" {...props}>
      {content}
    </Box>
  );
}
