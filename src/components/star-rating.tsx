import { Flex, IconProps } from "@chakra-ui/react";
import { StarEmptyIcon, StarFullIcon, StarHalfIcon } from "./icons";

export default function StarRating({ quality, stars = 5, ...props }: { quality: number; stars?: number } & IconProps) {
  const normalized = Math.round(quality * (stars * 2)) / 2;

  const renderStar = (i: number) => {
    if (normalized >= i + 1) return <StarFullIcon {...props} />;
    if (normalized === i + 0.5) return <StarHalfIcon {...props} />;
    return <StarEmptyIcon {...props} />;
  };

  return (
    <Flex gap="1">
      {Array(stars)
        .fill(0)
        .map((_, i) => renderStar(i))}
    </Flex>
  );
}
