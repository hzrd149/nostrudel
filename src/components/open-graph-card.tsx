import {
  Box,
  Card,
  CardBody,
  CardProps,
  Flex,
  Heading,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import useOpenGraphData from "../hooks/use-open-graph-data";

export default function OpenGraphCard({ url, ...props }: { url: URL } & Omit<CardProps, "children">) {
  const { value: data } = useOpenGraphData(url);

  const link = (
    <Link href={url.toString()} isExternal color="blue.500">
      {url.toString()}
    </Link>
  );

  const isVertical = useBreakpointValue({ base: true, md: false });

  if (!data) return link;

  return (
    <Card {...props}>
      <LinkBox
        as={CardBody}
        display="flex"
        gap="2"
        p="0"
        overflow="hidden"
        flexDirection={{ base: "column", md: "row" }}
      >
        {data.ogImage?.length === 1 && (
          <Image
            key={data.ogImage[0].url}
            src={new URL(data.ogImage[0].url, url).toString()}
            borderRadius="md"
            maxH="2in"
            maxW={isVertical ? "none" : "30%"}
            mx={isVertical ? "auto" : 0}
          />
        )}
        <Box p="2">
          <Heading size="sm">
            <LinkOverlay href={url.toString()} isExternal>
              {data.ogTitle?.trim() ?? data.dcTitle?.trim()}
            </LinkOverlay>
          </Heading>
          <Text isTruncated>{data.ogDescription || data.dcDescription}</Text>
          {link}
        </Box>
      </LinkBox>
    </Card>
  );
}
