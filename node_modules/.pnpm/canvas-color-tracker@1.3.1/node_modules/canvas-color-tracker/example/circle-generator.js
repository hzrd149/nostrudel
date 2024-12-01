// Generate random circles
function genCircles(width, height, N = 500) {
  const minR = 1;
  const maxR = Math.sqrt(width * height / N) * 0.5;

  return [...Array(N)].map((_, idx) => ({
    id: idx,
    x: Math.round(Math.random() * width),
    y: Math.round(Math.random() * height),
    r: Math.max(minR, Math.round(Math.random() * maxR))
  }));
}