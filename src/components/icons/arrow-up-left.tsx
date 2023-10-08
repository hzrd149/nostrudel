import { createIcon } from "@chakra-ui/icons";

const ArrowUpLeft = createIcon({
  displayName: "ArrowUpLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M17 17L7 7M7 7V17M7 7H17"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowUpLeft;
