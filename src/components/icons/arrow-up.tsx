import { createIcon } from "@chakra-ui/icons";

const ArrowUp = createIcon({
  displayName: "ArrowUp",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 19V5M12 5L5 12M12 5L19 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      key="Dcpt"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowUp;
