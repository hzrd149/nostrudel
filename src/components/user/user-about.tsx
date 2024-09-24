import { useMemo } from "react";
import { Box, BoxProps } from "@chakra-ui/react";

import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import useUserProfile from "../../hooks/use-user-profile";
import { embedNostrLinks, renderGenericUrl } from "../external-embeds";

export default function UserAbout({ pubkey, ...props }: { pubkey: string } & Omit<BoxProps, "children">) {
  const metadata = useUserProfile(pubkey);

  const aboutContent = useMemo(() => {
    if (!metadata?.about) return null;
    let content: EmbedableContent = [metadata.about.trim()];
    content = embedNostrLinks(content);
    content = embedUrls(content, [renderGenericUrl]);
    return content;
  }, [metadata?.about]);

  return (
    <Box whiteSpace="pre-line" {...props}>
      {aboutContent}
    </Box>
  );
}
