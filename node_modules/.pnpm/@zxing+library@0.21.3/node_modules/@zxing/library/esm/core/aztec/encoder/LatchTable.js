// The Latch Table shows, for each pair of Modes, the optimal method for
// getting from one mode to another.  In the worst possible case, this can
// be up to 14 bits.  In the best possible case, we are already there!
// The high half-word of each entry gives the number of bits.
// The low half-word of each entry are the actual bits necessary to change
export var LATCH_TABLE = [
    Int32Array.from([
        0,
        (5 << 16) + 28,
        (5 << 16) + 30,
        (5 << 16) + 29,
        (10 << 16) + (29 << 5) + 30 // UPPER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
        (9 << 16) + (30 << 4) + 14,
        0,
        (5 << 16) + 30,
        (5 << 16) + 29,
        (10 << 16) + (29 << 5) + 30 // LOWER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
        (4 << 16) + 14,
        (9 << 16) + (14 << 5) + 28,
        0,
        (9 << 16) + (14 << 5) + 29,
        (14 << 16) + (14 << 10) + (29 << 5) + 30
        // DIGIT -> UPPER -> MIXED -> PUNCT
    ]),
    Int32Array.from([
        (5 << 16) + 29,
        (5 << 16) + 28,
        (10 << 16) + (29 << 5) + 30,
        0,
        (5 << 16) + 30 // MIXED -> PUNCT
    ]),
    Int32Array.from([
        (5 << 16) + 31,
        (10 << 16) + (31 << 5) + 28,
        (10 << 16) + (31 << 5) + 30,
        (10 << 16) + (31 << 5) + 29,
        0
    ])
];
