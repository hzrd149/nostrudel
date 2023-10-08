import { createIcon } from "@chakra-ui/icons";

const ArrowDownRight = createIcon({
  displayName: "ArrowDownRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M7 7L17 17M17 17V7M17 17H7"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowDownRight;
