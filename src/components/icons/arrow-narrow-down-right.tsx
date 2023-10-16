import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowDownRight = createIcon({
  displayName: "ArrowNarrowDownRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 6L18 18M18 18V10M18 18H10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowDownRight;
