var random = require('../').random(42)
var seedrandom = require('seedrandom');

var alea = seedrandom.alea(42);
var xor128 = seedrandom.xor128(42);

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;
var testCount = 200;
var randomNumbers = [];

// add tests
suite.add('Native Math.random()', function() {
  var sum = 0;
  for (var i = 0; i < testCount; ++i) {
    sum += Math.random();
  }
  randomNumbers.push(sum);
}).add('ngraph.random', function() {
  var sum = 0;
  for (var i = 0; i < testCount; ++i) {
    sum += random.nextDouble()
  }
  randomNumbers.push(sum);
})
.add('xor128', function() {
  var sum = 0;
  for (var i = 0; i < testCount; ++i) {
    var res = xor128.double();
    sum += res
  }
  randomNumbers.push(sum);
})
.add('alea', function() {
  var sum = 0;
  for (var i = 0; i < testCount; ++i) {
    var res = alea.double();
    sum += res
  }
  randomNumbers.push(sum);
})
.on('cycle', function(event) {
  randomNumbers = [];
  console.log(String(event.target));
})
.run();
