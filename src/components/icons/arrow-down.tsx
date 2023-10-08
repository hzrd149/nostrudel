import { createIcon } from "@chakra-ui/icons";

const ArrowDown = createIcon({
  displayName: "ArrowDown",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 5V19M12 19L19 12M12 19L5 12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowDown;
