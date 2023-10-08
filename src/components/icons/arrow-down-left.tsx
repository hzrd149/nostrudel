import { createIcon } from "@chakra-ui/icons";

const ArrowDownLeft = createIcon({
  displayName: "ArrowDownLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M17 7L7 17M7 17H17M7 17V7"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowDownLeft;
