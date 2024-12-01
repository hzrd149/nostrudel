/**
 * Set of function that I find useful for explorations.
 */

 /**
  * Performs hermit interpolation of `x` between two edges
  */
export function smoothStep(edge0, edge1, x) {
  let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Clamp `x` to [min, max] range.
 */
export function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

/**
 * Collects main statistical properties of a collection
 */
export function collectStatistics(array) {
  if (array.length === 0) {
    return {
      min: undefined,
      max: undefined, 
      avg: undefined,
      sigma: undefined,
      mod: undefined, 
      count: 0
    }
  }
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let counts = new Map();
  array.forEach(x => {
    if (x < min) min = x;
    if (x > max) max = x;
    sum += x;
    counts.set(x, (counts.get(x) || 0) + 1)
  });
  let mod = Array.from(counts).sort((a, b) => b[1] - a[1])[0][0]

  let avg = sum /= array.length;
  let sigma = 0;
  array.forEach(x => {
    sigma += (x - avg) * (x - avg);
  });
  sigma = Math.sqrt(sigma / (array.length + 1));
  let count = array.length;
  return {min, max, avg, sigma, mod, count};
}