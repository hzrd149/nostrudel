import { Flex, IconProps } from "@chakra-ui/react";
import { StarEmptyIcon, StarFullIcon, StarHalfIcon } from "./icons";
import styled from "@emotion/styled";

const HiddenSlider = styled.input`
  position: absolute;
  left: -0.5em;
  right: -0.5em;
  bottom: 0;
  top: 0;
  padding: 0;
  width: -moz-available;
  opacity: 0;
  cursor: pointer;
`;

export default function StarRating({
  quality,
  stars = 5,
  color = "yellow.300",
  onChange,
  ...props
}: { quality: number; stars?: number; onChange?: (quality: number) => void } & Omit<IconProps, "onChange">) {
  const normalized = Math.round(quality * (stars * 2)) / 2;

  const renderStar = (i: number) => {
    if (normalized >= i + 1) return <StarFullIcon key={i} color={color} {...props} />;
    if (normalized === i + 0.5) return <StarHalfIcon key={i} color={color} {...props} />;
    return <StarEmptyIcon key={i} color={color} {...props} />;
  };

  return (
    <Flex gap="1" position="relative" flexShrink={0} wrap="nowrap" w="min-content">
      {onChange && (
        <HiddenSlider
          type="range"
          min={0}
          max={1}
          step={1 / 10}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      )}
      {Array(stars)
        .fill(0)
        .map((_, i) => renderStar(i))}
    </Flex>
  );
}
