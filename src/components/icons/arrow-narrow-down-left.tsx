import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowDownLeft = createIcon({
  displayName: "ArrowNarrowDownLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M18 6L6 18M6 18H14M6 18V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowDownLeft;
