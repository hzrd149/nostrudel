import { Box, BoxProps } from "@chakra-ui/react";
import { links, nostrMentions } from "applesauce-content/text";
import { useRenderedContent } from "applesauce-react/hooks";

import useUserProfile from "../../hooks/use-user-profile";
import { components } from "../content";
import { NostrMentionLink } from "../content/components/mention";
import { renderGenericUrl } from "../content/links";

const aboutComponents = {
  ...components,
  mention: NostrMentionLink,
};
const transformers = [links, nostrMentions];
const linkRenderers = [renderGenericUrl];

const ProfileAboutContentSymbol = Symbol.for("profile-about-content");

export default function UserAboutContent({ pubkey, ...props }: { pubkey: string } & Omit<BoxProps, "children">) {
  const profile = useUserProfile(pubkey);
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
