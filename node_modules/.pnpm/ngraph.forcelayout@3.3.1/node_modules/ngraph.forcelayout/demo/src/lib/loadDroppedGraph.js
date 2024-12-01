import fromDot from 'ngraph.fromdot';
import fromJson from 'ngraph.fromjson';
import bus from './bus.js';

/**
 * Loads graph from a dropped file
 */
export default function loadDroppedGraph(files) {
  let file = files[0];

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = e => {
    let content = e.target.result;
    let graph = tryDot(content) || tryJson(content);
    if (graph) bus.fire('load-graph', graph);
  }
  reader.onerror = (e) => {
    //eslint-disable-next-line
    console.log('error loading dot file: ', e)
  };

  function tryDot(fileContent) {
    try {
      return fromDot(fileContent);
    } catch (e) {
      //eslint-disable-next-line
      console.log('error loading dot file: ', e)
    }
  }
  function tryJson(fileContent) {
    try {
      return fromJson(JSON.parse(fileContent));
    } catch (e) {
      //eslint-disable-next-line
      console.log('error loading JSON: ', e)
    }
  }
}