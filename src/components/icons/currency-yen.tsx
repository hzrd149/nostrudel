import { createIcon } from "@chakra-ui/icons";

const CurrencyYen = createIcon({
  displayName: "CurrencyYen",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 20.5V11.5M12 11.5L18.5001 3.5M12 11.5L5.50012 3.5M18 11.5H5.99998M17 15.5H6.99998"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default CurrencyYen;
