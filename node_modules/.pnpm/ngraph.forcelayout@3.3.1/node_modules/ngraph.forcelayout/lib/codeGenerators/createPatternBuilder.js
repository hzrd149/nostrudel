const getVariableName = require('./getVariableName');

module.exports = function createPatternBuilder(dimension) {

  return pattern;
  
  function pattern(template, config) {
    let indent = (config && config.indent) || 0;
    let join = (config && config.join !== undefined) ? config.join : '\n';
    let indentString = Array(indent + 1).join(' ');
    let buffer = [];
    for (let i = 0; i < dimension; ++i) {
      let variableName = getVariableName(i);
      let prefix = (i === 0) ? '' : indentString;
      buffer.push(prefix + template.replace(/{var}/g, variableName));
    }
    return buffer.join(join);
  }
};
