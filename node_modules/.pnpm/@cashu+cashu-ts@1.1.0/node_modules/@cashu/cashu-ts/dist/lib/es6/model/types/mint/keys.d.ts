/**
 * Public keys are a dictionary of number and string. The number represents the amount that the key signs for.
 */
export type Keys = {
    [amount: number]: string;
};
/**
 * An array of mint keysets
 */
export type MintActiveKeys = {
    /**
     * Keysets
     */
    keysets: Array<MintKeys>;
};
/**
 * An array of mint keyset entries.
 */
export type MintAllKeysets = {
    /**
     * Keysets
     */
    keysets: Array<MintKeyset>;
};
/**
 * A mint keyset.
 */
export type MintKeys = {
    /**
     * Keyset ID
     */
    id: string;
    /**
     * Unit of the keyset.
     */
    unit: string;
    /**
     * Public keys are a dictionary of number and string. The number represents the amount that the key signs for.
     */
    keys: Keys;
};
/**
 * A mint keyset entry.
 */
export type MintKeyset = {
    /**
     * Keyset ID
     */
    id: string;
    /**
     * Unit of the keyset.
     */
    unit: string;
    /**
     * Whether the keyset is active or not.
     */
    active: boolean;
};
