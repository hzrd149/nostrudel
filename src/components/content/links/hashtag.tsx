import { Link } from "@chakra-ui/react";
import { Hashtag } from "applesauce-content/nast";
import RouterLink from "../../router-link";

export default function HashtagLink({ node }: { node: Hashtag }) {
  return (
    <Link as={RouterLink} to={`/t/${node.hashtag}`} color="blue.500">
      #{node.name}
    </Link>
  );
}
