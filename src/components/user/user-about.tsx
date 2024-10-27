import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";
import { nostrMentions } from "applesauce-content/text";

import useUserProfile from "../../hooks/use-user-profile";
import { renderGenericUrl } from "../content/links";
import { components } from "../content";

const transformers = [nostrMentions];
const linkRenderers = [renderGenericUrl];

export default function UserAbout({ pubkey, ...props }: { pubkey: string } & Omit<BoxProps, "children">) {
  const profile = useUserProfile(pubkey);
  const content = useRenderedContent(profile?.about, components, { transformers, linkRenderers });

  return (
    <Box whiteSpace="pre-line" {...props}>
      {content}
    </Box>
  );
}
