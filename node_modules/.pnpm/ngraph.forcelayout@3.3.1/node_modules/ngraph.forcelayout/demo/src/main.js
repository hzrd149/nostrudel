import Vue from 'vue'
import App from './App.vue'
import fileDrop from './lib/fileDrop.js';
import loadDroppedGraph from './lib/loadDroppedGraph.js';

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

// When they drop a `.dot` file into the browser - let's load it.
fileDrop(document.body, loadDroppedGraph);