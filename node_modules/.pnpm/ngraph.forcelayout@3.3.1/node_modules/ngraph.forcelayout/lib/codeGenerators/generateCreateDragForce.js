const createPatternBuilder = require('./createPatternBuilder');

module.exports = generateCreateDragForceFunction;
module.exports.generateCreateDragForceFunctionBody = generateCreateDragForceFunctionBody;

function generateCreateDragForceFunction(dimension) {
  let code = generateCreateDragForceFunctionBody(dimension);
  return new Function('options', code);
}

function generateCreateDragForceFunctionBody(dimension) {
  let pattern = createPatternBuilder(dimension);
  let code = `
  if (!Number.isFinite(options.dragCoefficient)) throw new Error('dragCoefficient is not a finite number');

  return {
    update: function(body) {
      ${pattern('body.force.{var} -= options.dragCoefficient * body.velocity.{var};', {indent: 6})}
    }
  };
`;
  return code;
}
