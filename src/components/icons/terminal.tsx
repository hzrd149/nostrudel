import { createIcon } from "@chakra-ui/icons";

const Terminal = createIcon({
  displayName: "Terminal",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M4 17L10 11L4 5M12 19H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Terminal;
