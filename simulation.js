import { getToken, getTokens, getTokensHistory, tokenTypes } from './core/tokens.js';
import { getNodeLabel } from './core/node.js';
import { getEdgeLabel } from './core/edge.js';
import { loadNetwork } from './examples/demo_1.js';

/**
 * Maximum number of datapoints store store per node
 */
const NODE_HISTORY_MAX_DP = 100;

/**
 * HTML housekeeping
 */
const elementActiveContainer = document.getElementById('elementActive');
const elementIdContainer = document.getElementById('elementId');

/**
 * Graphing
 */
const graphContainer = [
    document.getElementById('graph-0'),
    document.getElementById('graph-1'),
    document.getElementById('graph-2'),
    document.getElementById('graph-3'),
];

const graphLabelContainer = [
    document.getElementById('graph-label-0'),
    document.getElementById('graph-label-1'),
    document.getElementById('graph-label-2'),
    document.getElementById('graph-label-3'),
];

const graphLoadContainer = document.getElementById('graph-load');


const chartOptions = {
    start: 0,
    end: NODE_HISTORY_MAX_DP,

    drawPoints: false,
    shaded: {
      orientation: "bottom", // top, bottom
    },
    height: 100,
  };

/**
 * Dataset for graph is taken from the active node
 */
const chartVis = [
    new vis.Graph2d(graphContainer[0], null, chartOptions),
    new vis.Graph2d(graphContainer[1], null, chartOptions),
    new vis.Graph2d(graphContainer[2], null, chartOptions),
    new vis.Graph2d(graphContainer[3], null, chartOptions),
]
const chartLoadVis = new vis.Graph2d(graphLoadContainer, null, chartOptions);

/**
 * Store id of currently clicked element
 */
let activeEdgeId = false;
let activeNodeId = false;

const COLOR_EDGE_ACTIVE = 'red';
const COLOR_EDGE_NON_ACTIVE = 'green';

/**
 * Time in ms between two simulation ticks
 */
const TICK_DELAY_MS = 250;

/**
 * Simulation timer in ticks
 */
let simTime = 0;

// https://visjs.github.io/vis-network/examples/network/physics/physicsConfiguration.html
const options = {
    "edges": {
      "smooth": {
        "forceDirection": "none"
      }
    },
    "physics": {
      "barnesHut": {
        "springLength": 300
      },
      "minVelocity": 0.75
    }
  }

const nodes = new vis.DataSet();
const edges = new vis.DataSet();

loadNetwork({ nodes, edges });

/**
 * Basic housekeeping
 * 
 * @todo move this to generic function
 */
nodes.forEach((node) => { 
    node.cores = node.cores ?? 1;
    node.load = new vis.DataSet();
    node.cpuLoad = new vis.DataSet();
});

edges.forEach((edge) => { 
    edge.load = [];
    edge.loadCurrent = 0;

    edge.enabled !== false && (edge.enabled = true);
});
  
const container = document.getElementById('mynetwork');
const network = new vis.Network(
    container, 
    { nodes, edges }, 
    options
);

/**
 * Main event loop
 */
const tick = () => {
    
    simTime++;

    nodes.forEach((node) => {

        /**
         * Handle each token type - fetch the connected nodes for each
         * node and distribute the tokens
         */
        Object.entries(node.tokens).forEach(entry => {
            const [tokenType, tokens] = entry;
   
            let connectedNodes = [];

            /** 
             * Find the attached nodes with the correct edge type for the curren token type
             * 
             * Next distribute the tokens over the nodes
             * 
             * @todo the connected nodes can be cached
             */
            network.getConnectedEdges(node.id, 'to').forEach((connectedEdgeId) => { 
    
                const connectedEdge = edges.get(connectedEdgeId);

                /**
                 * Connected edges returns both the parent and the child nodes
                 * filter on all nodes for which the active node is the parent (from)
                 * 
                 * Only send tokens over the edge accepting the current token type
                 * 
                 * Only send tokens if the edge is enableds
                 */
                if (!connectedEdge.enabled ||
                     connectedEdge.from != node.id || 
                    !connectedEdge.tokenTypes.includes(tokenType)) {
                    return;
                }

                /**
                 * Collect the connected node
                 */
                const connectedNodeId = connectedEdge.to;

                connectedNodes.push({
                    connectedNode: nodes.get(connectedNodeId),
                    connectedEdge
                });
    
            });

            /**
             * Edges for the current node have been retrieved
             * 
             * Second loop - send tokens to the connected nodes
             */
            node.route(connectedNodes).forEach(({connectedNode, connectedEdge}) => {
                /**
                 * Reduce the tokens at the source - take a token from the start of the 
                 * array (aka the oldest token)
                 * 
                 * @todo : make this configurable
                 */
                const bandwidth = connectedEdge.bandwidth ?? 1
                let tokensSent = 0;

                for (let idx = 0; idx < bandwidth; idx++) {

                    /**
                     * Out of tokens?
                     */
                    if (tokens.length) {
                        const processToken = tokens.shift();

                        tokensSent++;

                        /**
                         * Set the received timestamp on the token so we can use
                         * it for timeouts
                         */
                        processToken.received = simTime;
                        
                        connectedNode._tempTokens[tokenType].push(processToken);

                        nodes.update([{ id: connectedNode.id, _tempTokens: connectedNode._tempTokens }]);
                    }
                }

                connectedEdge.loadCurrent = tokensSent;

            });
                  
            node.tokens[tokenType] = tokens;

            nodes.update([{ id: node.id, tokens: node.tokens }]);
        })
    });

    /**
     * Update the edges, add label and set width / color
     */    
    edges.forEach((edge) => {

        const tokensSent = edge.loadCurrent;

        /**
         * Add the load to the history
         */
        edge.load.push(tokensSent);

        /**
         * Rotate the array
         */
        if (edge.load.length > NODE_HISTORY_MAX_DP) {
            edge.load.shift();
        }
    
        edges.update([{ 
            id: edge.id,
            dashes: edge.enabled ? false : [10, 10],
            color: tokensSent ? 
                    COLOR_EDGE_ACTIVE : 
                    COLOR_EDGE_NON_ACTIVE,
            label: getEdgeLabel({ edge }),
            /**
             * Reset the current load for the next round
             */
            loadCurrent: 0,
        }]);
    });

    /**
     * Finalize: move tokens to active list and cleanup tempTokens
     */
    nodes.forEach((node) => {

        Object.keys(node.tokens).forEach((tokenType) => {
            node.tokens[tokenType] = node.tokens[tokenType].concat(node._tempTokens[tokenType]);

            /**
             * Tokens have been moved, zero the temp to be ready for the next round
             */
            node._tempTokens[tokenType] = [];
        });
        
    });

    /**
     * Node statistics
     *  
     * - Run the "cpu" on all nodes 
     * - Add the token count to the history
     * 
     * @todo - do this in a separate tick cycle to be able to handle conversions taking
     * over 1 tick
     */
    nodes.forEach((node) => {        
        /**
         * Active processes
         */
        let load = 0;

        /**
         * @todo Timeouts on tokens are called for each core.. there
         * should be a housekeeping / OS call - even better, the load
         * should be a float where housekeeping takes a bit less, the
         * node itself can check if it should be run for each core
         */
        for (let coreId = 0; coreId < node.cores; coreId++) {
            let processResult = false;

            node.processConfig.forEach( ({ operator, config }) => {                    
                processResult = 
                    operator({ ...config, nodes, node, simTime, coreId }) || processResult;
            });
        
            load += processResult;    
        }

        node.load.add({
            x: simTime,
            y: load
        });
        
        /**
         * @todo this is duplicate code
         */
        const oldLoadIds = node.load.getIds({
            filter: function (item) {
                return item.x < simTime - NODE_HISTORY_MAX_DP;
            },
        });
        node.load.remove(oldLoadIds);
        
        /**
         * Compute a cpuLoad 
         * 
         * This takes all the values in the load array into account,
         * cpu load takes some time to respond to the actual load
         */
        var loadSum = 0
        node.load.forEach((currentValue) => loadSum += currentValue.y);
        const averageLoad = loadSum / node.load.length;
    
        const cpuLoad = Math.round((averageLoad / node.cores) * 100);
        node.cpuLoadCurrent = cpuLoad;

        node.cpuLoad.add({
            x: simTime,
            y: cpuLoad,
        })

        /**
         * @todo this is duplicate code
         */
        const oldCpuLoadIds = node.cpuLoad.getIds({
            filter: function (item) {
                return item.x < simTime - NODE_HISTORY_MAX_DP;
            },
        });
        node.cpuLoad.remove(oldCpuLoadIds);        

        /**
         * Load computation done - move to history of the tokentypes
         */
        Object.keys(node.tokens).forEach((tokenType) => {
            node.history[tokenType].add({
                x: simTime,
                y: node.tokens[tokenType].length,
            });

            /**
             * Remove oldest id
             * 
             * @todo feels like it is better to cleanup every few ticks or so
             */
            const oldIds = node.history[tokenType].getIds({
                filter: function (item) {
                    return item.x < simTime - NODE_HISTORY_MAX_DP;
                },
            });
            node.history[tokenType].remove(oldIds);
        });

        nodes.update([{ ...node, load: node.load, history: node.history }]);
    });

    /**
     * Scaling?
     */
    nodes.forEach((node) => {      
        
        /**
         * Scale
         */
        if (node.cpuLoadCurrent > 30 && node.scale) {
            /**
             * Shoud be constuctor
             */
            let newNodeId = nodes.add({
                name: node.name + ' clone',
                route: node.route,
                processConfig: node.processConfig,
                tokens: getTokens(),
                _tempTokens: getTokens(),
                history: getTokensHistory(),
                shape: node.shape,
                color: node.color,
                cores: node.cores,
                
                load: new vis.DataSet(),
                cpuLoad: new vis.DataSet(),

                font: node.font,
                margin: node.margin,
            })[0];

            /**
             * Clone the edges
             */
            network.getConnectedEdges(node.id).forEach((connectedEdgeId) => { 
                const connectedEdge = edges.get(connectedEdgeId);

                console.log(connectedEdge)

                /**
                 * Should be constructor
                 */
                edges.add({ 
                    from: connectedEdge.from == node.id ? newNodeId : connectedEdge.from, 
                    to: connectedEdge.to == node.id ? newNodeId : connectedEdge.to, 
                    tokenTypes: connectedEdge.tokenTypes,
                    bandwidth: connectedEdge.bandwidth,

                    load: [],
                    loadCurrent: 0,
                
                    enabled: connectedEdge.enabled,

                    font: connectedEdge.font, 
                    width: connectedEdge.width,
                    arrows: connectedEdge.arrows,
                })
            });

            /**
             * Hack for now - scale once, should set timestamp?
             */
            node.scale = false

            node.color = { border: 'red' }  

        } else {

            node.color = { border: 'black' }  

        }

        nodes.update([{ ...node }]);
    });


    /**
     * Update all the labels
     */
    nodes.forEach((node) =>{
        let label = getNodeLabel({ node, simTime });

        nodes.update([{ ...node, label }]);
    })

    /**
     * Show the graphs of the active node
     */
    if (activeNodeId) {
        var range = chartVis[0].getWindow();
        var interval = range.end - range.start;
                
        var chartIdx = 0;
        Object.keys(nodes.get(activeNodeId).history).every((tokenType) => {

            if (nodes.get(activeNodeId).history[tokenType].length) {

                chartVis[chartIdx].setItems(
                    nodes.get(activeNodeId).history[tokenType]
                );
                chartVis[chartIdx].setWindow(simTime - interval, simTime, { animation: false })

                graphLabelContainer[chartIdx].innerHTML = tokenType;

                /**
                 * Stop showing tokens if there are no more charts left
                 */
                return chartIdx++ < chartVis.length - 1;
            }
        })

        /**
         * Generic graph for all nodes
         */
        chartLoadVis.setItems(
            nodes.get(activeNodeId).cpuLoad
        );
        chartLoadVis.setWindow(simTime - interval, simTime, { animation: false });
    }
}

const eventLoop = setInterval(tick, TICK_DELAY_MS);

/**
 * Events
 */
network.on("click", function (params) {

    params.event = "[original event]";

    activeNodeId = this.getNodeAt(params.pointer.DOM);
    activeEdgeId = this.getEdgeAt(params.pointer.DOM);
    
    console.log(`Clicked edge ${activeEdgeId} node ${activeNodeId}`);

    /**
     * A node has been clicked
     */
    if (activeNodeId) {
        // var newColor = "#" + Math.floor(Math.random() * 255 * 255 * 255).toString(16);
        let activeNode = nodes.get(activeNodeId);
        
        //addUserRequest({ node: activeNode, simTime});

        //nodes.update([{ id: activeNodeId, tokens: activeNode.tokens }]);

        elementIdContainer.innerHTML = activeNode.id;
    } else {
        activeNodeId = false;
    }

    if (activeEdgeId) {
        let activeEdge = edges.get(activeEdgeId);

        elementActiveContainer.checked = activeEdge.enabled;
        elementIdContainer.innerHTML = activeEdge.id;
    } else {
        activeEdgeId = false;
    }

});

const elementActiveClick = (event) => {

    /**
     * Disable or enable the edge
     */
    if (activeEdgeId) {
        let activeEdge = edges.get(activeEdgeId);

        activeEdge.enabled = elementActiveContainer.checked;

        edges.update([{ ...activeEdge }]);
    }
}
elementActiveContainer.onclick = elementActiveClick;
