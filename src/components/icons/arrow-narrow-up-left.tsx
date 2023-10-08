import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowUpLeft = createIcon({
  displayName: "ArrowNarrowUpLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M18 18L6 6M6 6V14M6 6H14"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowUpLeft;
