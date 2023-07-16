import { Box, CardProps, Heading, Image, Link, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import useOpenGraphData from "../hooks/use-open-graph-data";

export default function OpenGraphCard({ url, ...props }: { url: URL } & Omit<CardProps, "children">) {
  const { value: data } = useOpenGraphData(url);

  const link = (
    <Link href={url.toString()} isExternal color="blue.500">
      {url.toString()}
    </Link>
  );

  if (!data) return link;

  return (
    <LinkBox borderRadius="lg" borderWidth={1} overflow="hidden" {...props}>
      {data.ogImage?.length === 1 && (
        <Image key={data.ogImage[0].url} src={new URL(data.ogImage[0].url, url).toString()} mx="auto" maxH="3in" />
      )}

      <Box m="2" mt="4">
        <Heading size="sm" my="2">
          <LinkOverlay href={url.toString()} isExternal>
            {data.ogTitle?.trim() ?? data.dcTitle?.trim()}
          </LinkOverlay>
        </Heading>
        <Text isTruncated>{data.ogDescription || data.dcDescription}</Text>
        {link}
      </Box>
    </LinkBox>
  );
}
