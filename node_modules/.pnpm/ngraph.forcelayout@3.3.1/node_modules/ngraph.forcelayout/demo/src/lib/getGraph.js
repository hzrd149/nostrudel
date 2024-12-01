/**
 * Load your graph here.
 */
// https://github.com/anvaka/miserables
import miserables from 'miserables';

// Other loaders: 
// https://github.com/anvaka/ngraph.generators
// import generate from 'ngraph.generators';

// https://github.com/anvaka/ngraph.graph
// import createGraph from 'ngraph.graph';

// https://github.com/anvaka/ngraph.fromjson
// import fromjson from 'ngraph.fromjson'

// https://github.com/anvaka/ngraph.fromdot
// import fromdot from 'ngraph.fromdot'

export default function getGraph() {
  return miserables.create();
  // return generate.wattsStrogatz(20, 5, 0.4);
}

