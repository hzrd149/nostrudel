import createGraph from 'ngraph.graph';
import miserables from 'miserables';
import generate from 'ngraph.generators';

let cache = simpleCache();

export default function loadGraph(name) {
  if (name === 'Miserables') return Promise.resolve(miserables);
  if (name === 'Binary') return Promise.resolve(generate.balancedBinTree(10));

  let mtxObject = cache.get(name);
  if (mtxObject) return Promise.resolve(renderGraph(mtxObject.links, mtxObject.recordsPerEdge));

  return fetch(`https://s3.amazonaws.com/yasiv_uf/out/${name}/index.js`, {
    mode: 'cors'
  })
  .then(x => x.json())
  .then(mtxObject => {
    cache.put(name, mtxObject);
    return renderGraph(mtxObject.links, mtxObject.recordsPerEdge);
  });
}
function renderGraph (edges, recordsPerEdge) {
  let graph = createGraph();
  for(var i = 0; i < edges.length - 1; i += recordsPerEdge) {
      graph.addLink(edges[i], edges[i + 1]);
  }
  return graph
}

function simpleCache() {
    var supported = 'localStorage' in window;

    return {
        get : function(key) {
            if (!supported) { return null; }
            var graphData = JSON.parse(window.localStorage.getItem(key));
            if (!graphData || graphData.recordsPerEdge === undefined) {
              // this is old cache. Invalidate it
              return null;
            }
            return graphData;
        },
        put : function(key, value) {
            if (!supported) { return false;}
            try {
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch(err) {
                // TODO: make something clever than this in case of quata exceeded.
                window.localStorage.clear();
            }
        }
    };
}
