var graph = require('ngraph.generators').grid(20, 20);

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

// add tests
suite.add('Run default', function() {
  var layout = require('../')(graph);
  for (var i = 0; i < 20; ++i) {
    layout.step();
  }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
// run async
.run({ 'async': true });
