import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";
import { links } from "applesauce-content/text";

import useUserProfile from "../../hooks/use-user-profile";
import { renderGenericUrl } from "../content/links";
import { components } from "../content";

const transformers = [links];
const linkRenderers = [renderGenericUrl];

const ProfileAboutContentSymbol = Symbol.for("profile-about-content");

export default function UserAboutContent({ pubkey, ...props }: { pubkey: string } & Omit<BoxProps, "children">) {
  const profile = useUserProfile(pubkey);
  const content = useRenderedContent(profile?.about, components, {
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
