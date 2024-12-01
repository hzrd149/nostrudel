module.exports = Spring;

/**
 * Represents a physical spring. Spring connects two bodies, has rest length
 * stiffness coefficient and optional weight
 */
function Spring(fromBody, toBody, length, springCoefficient) {
    this.from = fromBody;
    this.to = toBody;
    this.length = length;
    this.coefficient = springCoefficient;
}
