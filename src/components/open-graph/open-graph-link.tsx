import { Link, LinkProps } from "@chakra-ui/react";
import useOpenGraphData from "../../hooks/use-open-graph-data";

export default function OpenGraphLink({ url, ...props }: { url: URL } & Omit<LinkProps, "children">) {
  const { value: data } = useOpenGraphData(url);

  return (
    <Link href={url.toString()} isExternal color="blue.500" {...props}>
      {data?.ogTitle?.trim() ?? data?.dcTitle?.trim() ?? decodeURI(url.toString())}
    </Link>
  );
}
