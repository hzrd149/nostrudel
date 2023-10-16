import { createIcon } from "@chakra-ui/icons";

const ChevronRight = createIcon({
  displayName: "ChevronRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronRight;
