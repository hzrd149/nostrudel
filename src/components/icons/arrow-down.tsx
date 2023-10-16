import { createIcon } from "@chakra-ui/icons";

const ArrowDown = createIcon({
  displayName: "ArrowDown",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 5V19M12 19L19 12M12 19L5 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowDown;
