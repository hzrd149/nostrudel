import React from "react";
import { EmbedableContent } from "../helpers/embeds";
import { Text } from "@chakra-ui/react";

export default function EmbeddedContent({ content }: { content: EmbedableContent }) {
  return (
    <>
      {content.map((part, i) =>
        typeof part === "string" ? (
          <Text as="span" key={"part-" + i}>
            {part}
          </Text>
        ) : (
          React.cloneElement(part, { key: "part-" + i })
        )
      )}
    </>
  );
}
