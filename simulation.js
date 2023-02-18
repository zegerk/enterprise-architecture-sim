import { tokenTypes, getTokens, getToken } from './core/tokens.js';
import { getNodeLabel } from './core/node.js';

import { loadNetwork, edgeConfig } from './examples/demo_1.js';

/**
 * Time in ms between two simulation ticks
 */
const TICK_DELAY_MS = 250;

/**
 * Simulation timer in ticks
 */
let simTime = 0;

/**
 * Load the network
 */
const container = document.getElementById('mynetwork');

// https://visjs.github.io/vis-network/examples/network/physics/physicsConfiguration.html
const options = {
    "edges": {
      "smooth": {
        "forceDirection": "none"
      }
    },
    "physics": {
      "barnesHut": {
        "springLength": 200
      },
      "minVelocity": 0.75
    }
  }

const nodes = new vis.DataSet();
const edges = new vis.DataSet();

loadNetwork({ nodes, edges });
  
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
         * Handle each token type
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
                 * filter on all nodes for which the active nod is the parent (from)
                 * 
                 * Only send tokens over the edge accepting the current token type
                 */
                if (connectedEdge.from != node.id || !connectedEdge.tokenTypes.includes(tokenType)) {
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
             * Second loop - send tokens to the connected nodes
             */
            node.route(connectedNodes).forEach(({connectedNode, connectedEdge}) => {
                /**
                 * Reduce the tokens at the source - take a token from the start of the 
                 * array (aka the oldest token)
                 * 
                 * @todo : make this configurable
                 */
                let bandwidth = connectedEdge.bandwidth ?? 1
                
                /**
                 * Reset the edge color
                 */
                let edgeLabel = '0%';
                edges.update([{ 
                    id: connectedEdge.id, label: edgeLabel, color: edgeConfig[tokenType].color
                 }])

                for (let idx = 0; idx < bandwidth; idx++) {

                    /**
                     * Out of tokens?
                     */
                    if (tokens.length) {

                        const processToken = tokens.shift();

                        /**
                         * Set the received timestamp on the token so we can use
                         * it for timeouts
                         */
                        processToken.received = simTime;
                        
                        connectedNode._tempTokens[tokenType].push(processToken);

                        nodes.update([{ id: connectedNode.id, _tempTokens: connectedNode._tempTokens }]);

                        /**
                         * Show edge as active
                         */
                        const edgelabel = Math.round(100 * ((idx + 1) / bandwidth)) + '%';
                        edges.update([{ 
                            id: connectedEdge.id, color: edgeConfig[tokenType].colorActive,
                            label: edgelabel,
                        }]);
                    }
                }
            });
                  
            node.tokens[tokenType] = tokens;

            nodes.update([{ id: node.id, tokens: node.tokens }]);
        })
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
     * Process all tokens in all nodes
     * 
     * @todo - do this in a separate tick cycle to simulate "slow" processing?
     */
    nodes.forEach((node) => {
        if (!node.process) {
            return;
        } 
        
        /**
         * Active processes
         */
        let load = 0;

        /**
         * @todo Timeouts on tokens are called for each core.. there
         * should be a housekeeping / OS call 
         */
        for (let idx = 0; idx < node.cores; idx++) {
            load += node.process({ node, simTime });
        }

        nodes.update([{ ...node, load }]);
    });


    /**
     * Update all the labels
     */
    nodes.forEach((node) =>{
        let label = getNodeLabel({ node, simTime });

        nodes.update([{ ...node, label }]);
    })

    /**
     * Test graphing on usernode
     */

    performanceChart.data.labels.push(simTime);
    performanceChart.data.datasets[0].data.push(
        nodes.get(1).tokens[tokenTypes.TOKEN_TYPE_FAIL].length 
    );

    if (simTime > 100) {
        performanceChart.data.labels.shift();
        performanceChart.data.datasets[0].data.shift();

        performanceChart.scales.x.options.min = simTime - 100;
    }

    performanceChart.update();


        /*
        network.getConnectedEdges(node.id).forEach((edgeId => {
           
            console.log(`Checking edge ${edgeId}`);

            const edge = network.selectEdges(edgeId);

            console.log(edge);

        }))
        */
    
}

const eventLoop = setInterval(tick, TICK_DELAY_MS);

/**
 * EVents
 */

network.on("click", function (params) {
    params.event = "[original event]";
    /*
    console.log(JSON.stringify(
        params,
        null,
        4
    ));

    console.log(
        "click event, getNodeAt returns: " +
        this.getNodeAt(params.pointer.DOM)
    );
    */

    let activeNodeId = this.getNodeAt(params.pointer.DOM);

    /**
     * A node has been clicked
     */
    if (activeNodeId) {
        // var newColor = "#" + Math.floor(Math.random() * 255 * 255 * 255).toString(16);
        let activeNode = nodes.get(activeNodeId);
        
        //console.log(activeNode);

        activeNode.tokens[tokenTypes.TOKEN_TYPE_REQ].push(getToken());
 
        nodes.update([{ id: activeNodeId, label: getNodeLabel({ activeNode, simTime }) }]);


    };

});

/**
 * Charting stuff
 */
var performanceChartRef = document.getElementById("performanceChart");
var performanceChart = new Chart(performanceChartRef, {
    type: 'line',
    data: {
        datasets: [{
            data: []
        }]
    },
    options: {
        responsive: true,
    },
});