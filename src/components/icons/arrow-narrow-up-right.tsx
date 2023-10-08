import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowUpRight = createIcon({
  displayName: "ArrowNarrowUpRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 18L18 6M18 6H10M18 6V14"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowUpRight;
