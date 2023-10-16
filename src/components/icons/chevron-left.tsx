import { createIcon } from "@chakra-ui/icons";

const ChevronLeft = createIcon({
  displayName: "ChevronLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronLeft;
