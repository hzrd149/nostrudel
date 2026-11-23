import { createIcon } from "@chakra-ui/icons";

/**
 * Namecoin verified icon — shield with checkmark and "N" motif.
 * Distinct from the standard NIP-05 verified icon to indicate
 * decentralised blockchain-based identity verification.
 */
const NamecoinVerifiedIcon = createIcon({
  displayName: "NamecoinVerifiedIcon",
  viewBox: "0 0 24 24",
  path: (
    <>
      {/* Shield outline */}
      <path
        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
});

export default NamecoinVerifiedIcon;
