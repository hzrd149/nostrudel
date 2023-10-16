import { createIcon } from "@chakra-ui/icons";

const Plus = createIcon({
  displayName: "Plus",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Plus;
