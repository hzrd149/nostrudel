import { Box, CardProps, Code, Heading, Image, Link, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import useOpenGraphData from "../hooks/use-open-graph-data";

export default function OpenGraphCard({ url, ...props }: { url: URL } & Omit<CardProps, "children">) {
  const { value: data, loading } = useOpenGraphData(url);

  const link = (
    <Link href={url.toString()} isExternal color="blue.500">
      {url.toString()}
    </Link>
  );

  if (!data) return link;

  return (
    <LinkBox borderRadius="lg" borderWidth={1} overflow="hidden" {...props}>
      {data.ogImage?.map((ogImage) => (
        <Image key={ogImage.url} src={ogImage.url} mx="auto" />
      ))}

      <Box m="2" mt="4">
        <Heading size="sm" my="2">
          <LinkOverlay href={url.toString()} isExternal>
            {data.ogTitle ?? data.dcTitle}
          </LinkOverlay>
        </Heading>
        <Text>{data.ogDescription || data.dcDescription}</Text>
        {link}
      </Box>
    </LinkBox>
  );
}
