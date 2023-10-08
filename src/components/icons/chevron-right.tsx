import { createIcon } from "@chakra-ui/icons";

const ChevronRight = createIcon({
  displayName: "ChevronRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronRight;
