<template>
  <div id="app">
    <h2><a href='https://github.com/anvaka/ngraph.forcelayout'>ngraph.forcelayout</a> demo
      <small class='toggle-settings'><a href='#' @click.prevent='settingsOpen = !settingsOpen'>{{settingsOpen ? 'hide settings' : 'show settings'}}</a></small>
    </h2>
    <div class='content' v-if='settingsOpen'>
      <div class='row'>
        <div class='label'>Graph </div>
        <select v-model='selectedGraph' :disable='loading' class='value'>
          <option v-for="graph in graphs" :key='graph' :value='graph'>{{graph}}</option>
        </select>
      </div>
      <input-value label='Time step' v-model='layoutSettings.timeStep'>
      This is integration time step value. The higher it is, the faster nodes will move, but setting it too high
      can result in lots of jitter and instability.
      </input-value>
      <input-value label='Gravity' v-model='layoutSettings.gravity'>
        This coefficient defines how strongly each node repels each other.
      </input-value>
      <input-value label='Ideal spring length' v-model='layoutSettings.springLength'>
         What is the ideal length of each spring?
      </input-value>
      <input-value label='Spring coefficient' v-model='layoutSettings.springCoefficient'>
        Higher values makes the spring force stronger, pushing edges closer to the ideal spring length.
      </input-value>
      <input-value label='Drag coefficient' v-model='layoutSettings.dragCoefficient'>
        This coefficient introduces "resistance" from environment. When it is close to 0 the forces
        will have a lot of freedom, nothing will be stopping them, and that can result in a very
        unstable simulation.
      </input-value>
      <input-value label='Theta' v-model='layoutSettings.theta'>
        This coefficient influences when we apply long distance forces approximation. When this value is
        close to 0, the simulation compares forces between every single node (giving O(n^2), slow performance).
        Recommended value is 0.8.
      </input-value>

      <input-value label='Dimensions' v-model='layoutSettings.dimensions' step=1>
      Defines number of dimensions of the space where layout is performed. For visualization purpose
      2 or 3 dimensions are normally enough. Note: Memory consumptions grows exponentially with number
      of dimensions.
      </input-value>

      <input-flag label='Follow bounding box' v-model='fixedViewBox' step=1>
      Setting this to true will disable pan/zoom but will always keep the graph visible. This is not
      part of the layout algorithm. Just a view setting of the renderer.
      </input-flag>
      <div v-if='loading'>Loading graph...</div>
    </div>
      <div v-if='!loading' class='layout-box'>
        <a href="#" @click.prevent='toggleLayoutRun' class='btn'>{{isRunning ? 'Stop layout' : 'Start layout'}}</a> 
      </div>
  </div>
</template>

<script>
import createGraphScene from './lib/createGraphScene';
import getAvailableGraphs from './lib/getAvailableGraphs';
import loadGraph from './lib/loadGraph';
import bus from './lib/bus';
import queryState from 'query-state';
import InputValue from './components/InputValue';
import InputFlag from './components/InputFlag';

let appState = queryState({
  graph: 'Miserables',
  timeStep: 0.5,
  springLength: 10,
  springCoefficient: 0.8,
  dragCoefficient: 0.9,
  dimensions: 2,
  theta: 0.8,
  gravity: -12,
}, { useSearch: true });

export default {
  name: 'app',
  components: {
    InputValue,
    InputFlag
  },
  methods: {
    toggleLayoutRun() {
      this.isRunning = !this.isRunning;
      this.scene.runLayout(this.isRunning);
    },

    loadNewGraph(newGraph) {
      this.loading = true;
      this.stats = null;
      this.isRunning = false;

      loadGraph(newGraph).then(newGraph => {
        bus.fire('load-graph', newGraph, this.selectedLayout);
        this.loading = false;
      });
    },
    onGraphLoaded() {
      this.isRunning = false;
    }
  },
  watch: {
    layoutSettings: {
      deep: true,
      handler(newValue) {
        this.scene.updateLayoutSettings(newValue);
        appState.set(newValue);
      }
    },
    fixedViewBox(newValue) {
      this.scene.setFixedViewBox(newValue);
    },
    selectedGraph(newGraph) {
      appState.set('graph', newGraph);
      this.loadNewGraph(newGraph);
    }
  },
  data() {
    let graphs = getAvailableGraphs();
    return {
      isRunning: false,
      fixedViewBox: false,
      selectedGraph: appState.get('graph'),
      settingsOpen: window.innerWidth > 500,
      loading: false,
      layoutSettings: {
        timeStep: appState.get('timeStep'),
        springLength: appState.get('springLength'),
        springCoefficient: appState.get('springCoefficient'),
        dragCoefficient: appState.get('dragCoefficient'),
        dimensions: appState.get('dimensions'),
        theta: appState.get('theta'),
        gravity: appState.get('gravity'),
      },
      graphs
    }
  },
  mounted() {
    const canvas = document.getElementById('cnv');
    this.scene = createGraphScene(canvas, {...this.layoutSettings});
    this.loadNewGraph(this.selectedGraph);
    bus.on('load-graph', this.onGraphLoaded);
  },

  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
    }
  }
}

</script>

<style lang='stylus'>
small-screen = 500px;

#app {
  position: absolute;
  width: 400px;
  background: rgb(12, 41, 82);
  border: 1px solid white;
}
a {
  text-decoration: none;
}
.content {
  padding: 8px;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.row .label {
  flex: 1;
}
.row .value {
  flex: 1;
}
.row select {
  width: 100%;
}

a.btn {
  color: rgb(244, 244, 244);
  text-decoration: none;
  justify-content: center;
  align-items: center;
  border-top: 1px solid;
  height: 32px;
  width: 100%;
  display: flex;
  margin: 0;
}
h2 {
  margin: 8px;
  font-size: 18px;
  font-weight: normal;
  a {
    color: #267fcd;
  }
  small a {
    position: absolute;
    right: 8px;
    top: 8px;
    font-size: 12px;
  }
}
.number {
  color: yellow;
  font-size: 18px;
}
.names {
  position: fixed;
  font-size: 24px;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
}
@media (max-width: small-screen) {
  #app {
    width: 100%;
  }
}
</style>
