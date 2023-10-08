import { createIcon } from "@chakra-ui/icons";

const ArrowRight = createIcon({
  displayName: "ArrowRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowRight;
