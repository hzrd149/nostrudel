import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowUp = createIcon({
  displayName: "ArrowNarrowUp",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 20V4M12 4L6 10M12 4L18 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowUp;
