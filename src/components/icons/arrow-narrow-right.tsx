import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowRight = createIcon({
  displayName: "ArrowNarrowRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M4 12H20M20 12L14 6M20 12L14 18"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowRight;
