const createPatternBuilder = require('./createPatternBuilder');

module.exports = generateCreateSpringForceFunction;
module.exports.generateCreateSpringForceFunctionBody = generateCreateSpringForceFunctionBody;

function generateCreateSpringForceFunction(dimension) {
  let code = generateCreateSpringForceFunctionBody(dimension);
  return new Function('options', 'random', code);
}

function generateCreateSpringForceFunctionBody(dimension) {
  let pattern = createPatternBuilder(dimension);
  let code = `
  if (!Number.isFinite(options.springCoefficient)) throw new Error('Spring coefficient is not a number');
  if (!Number.isFinite(options.springLength)) throw new Error('Spring length is not a number');

  return {
    /**
     * Updates forces acting on a spring
     */
    update: function (spring) {
      var body1 = spring.from;
      var body2 = spring.to;
      var length = spring.length < 0 ? options.springLength : spring.length;
      ${pattern('var d{var} = body2.pos.{var} - body1.pos.{var};', {indent: 6})}
      var r = Math.sqrt(${pattern('d{var} * d{var}', {join: ' + '})});

      if (r === 0) {
        ${pattern('d{var} = (random.nextDouble() - 0.5) / 50;', {indent: 8})}
        r = Math.sqrt(${pattern('d{var} * d{var}', {join: ' + '})});
      }

      var d = r - length;
      var coefficient = ((spring.coefficient > 0) ? spring.coefficient : options.springCoefficient) * d / r;

      ${pattern('body1.force.{var} += coefficient * d{var}', {indent: 6})};
      body1.springCount += 1;
      body1.springLength += r;

      ${pattern('body2.force.{var} -= coefficient * d{var}', {indent: 6})};
      body2.springCount += 1;
      body2.springLength += r;
    }
  };
`;
  return code;
}
