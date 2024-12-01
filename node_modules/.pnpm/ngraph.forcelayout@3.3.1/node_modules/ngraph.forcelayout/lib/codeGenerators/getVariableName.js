module.exports = function getVariableName(index) {
  if (index === 0) return 'x';
  if (index === 1) return 'y';
  if (index === 2) return 'z';
  return 'c' + (index + 1);
};