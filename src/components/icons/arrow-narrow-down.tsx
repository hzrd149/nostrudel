import { createIcon } from "@chakra-ui/icons";

const ArrowNarrowDown = createIcon({
  displayName: "ArrowNarrowDown",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 4V20M12 20L18 14M12 20L6 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowNarrowDown;
