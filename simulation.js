/**
 * Simulation timer in ticks
 */
let simTime = 0;

/**
 * Enum for token types
 */
const tokenTypes = {
    TOKEN_TYPE_IN: 'in',
    TOKEN_TYPE_OUT: 'out'
}

/**
 * Token factory
 */
const getToken = () => {
    return {
        created: simTime
    };
}

/**
 * Tokens factory for the nodes
 */
const getTokens = () => {
    return {
        [tokenTypes.TOKEN_TYPE_IN]: [],
        [tokenTypes.TOKEN_TYPE_OUT]: [],
    };
}

/**
 * @todo a bit crude.
 * 
 * @param {*} node 
 * @returns 
 */
const getNodeLabel = (node) => {
    return 'In : ' + node.tokens[tokenTypes.TOKEN_TYPE_IN].length + "\n" +
           'Out : ' + node.tokens[tokenTypes.TOKEN_TYPE_OUT].length + "\n" + 
           node.name;
}

/**
 * Process the tokens my converting in tokens to out tokens
 */
const processDb = () => (node) => {
    node.tokens[tokenTypes.TOKEN_TYPE_OUT] = node.tokens[tokenTypes.TOKEN_TYPE_IN];
    node.tokens[tokenTypes.TOKEN_TYPE_IN] = [];

    nodes.update({...node});
}

/**
 * Test
 */
const processUsers = () => (node) => {
    node.tokens[tokenTypes.TOKEN_TYPE_IN].push(getToken())

    nodes.update({...node});
}

/**
 * Where to send the token
 */
const routeDefault = () => (nodes) => {
    return nodes.length ? [nodes[0]] : [];
}

const routeRandom = () => (nodes) => {
    return nodes.length 
        ? [nodes[Math.floor(Math.random() * nodes.length)]] 
        : [];
}

/**
 * Labels are set in the code
 */
const nodes = new vis.DataSet([
    { id: 1, name: "users", 
        route: routeDefault(), process: processUsers(), 
        tokens: getTokens(), _tempTokens: getTokens(), shape: 'diamond',
    },


    { id: 2, name: "api gateway", route: routeRandom(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'square' },
    { id: 3, name: "service 1", route: routeDefault(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'square' },
    { id: 4, name: "service 2", route: routeDefault(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'square' },
    { id: 5, name: "service 3", route: routeDefault(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'square' },
    { id: 6, name: "db s1", route: routeDefault(), process: processDb(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
    { id: 7, name: "db s2", route: routeDefault(), process: processDb(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
    { id: 8, name: "db s3", route: routeDefault(), process: processDb(), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
]);

// create an array with edges
var edges = new vis.DataSet([
    /**
     * Users to API gateways
     */
    { from: 1, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 2, to: 1, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 2, to: 3, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 3, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 2, to: 4, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 4, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 2, to: 5, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 5, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 3, to: 6, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 6, to: 3, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 4, to: 7, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 7, to: 4, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
    
    { from: 5, to: 8, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_IN] },
    { from: 8, to: 5, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_OUT] },
]);

const edgeConfig = {
    [tokenTypes.TOKEN_TYPE_IN] : {
        color: 'black',
        colorActive: 'red',
    },
    [tokenTypes.TOKEN_TYPE_OUT] : {
        color: 'gray',
        colorActive: 'green',
    }    
}

// create a network
var container = document.getElementById("mynetwork");

var data = {
    nodes: nodes,
    edges: edges,
};

var options = {};
var network = new vis.Network(container, data, options);

/**
 * Main event loop
 */
const tick = () => {
    console.log(`tick ${simTime++}`);

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
                 * Out of tokens?
                 */
                if (!tokens.length) {
                    /**
                     * Edge not active this round
                     * 
                     * @todo this fails if an edge can handle multiple token types
                     */
                    edges.update([{ id: connectedEdge.id, color: edgeConfig[tokenType].color }])

                    return;
                }    

                /**
                 * Reduce the tokens at the source
                 */
                const processToken = tokens.pop();
                
                connectedNode._tempTokens[tokenType].push(processToken);

                nodes.update([{ id: connectedNode.id, _tempTokens: connectedNode._tempTokens }]);

                /**
                 * Show edge as active
                 */
                edges.update([{ id: connectedEdge.id, color: edgeConfig[tokenType].colorActive }])
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
        node.process && node.process(node)
    });

    /**
     * Update all the labels
     */
    nodes.forEach((node) =>{
        let label = getNodeLabel(node);

        nodes.update([{ ...node, label }]);
    })

        /*
        network.getConnectedEdges(node.id).forEach((edgeId => {
           
            console.log(`Checking edge ${edgeId}`);

            const edge = network.selectEdges(edgeId);

            console.log(edge);

        }))
        */
    
}

const eventLoop = setInterval(tick,1000);

/**
 * EVents
 */

network.on("click", function (params) {
    params.event = "[original event]";
    console.log(JSON.stringify(
        params,
        null,
        4
    ));

    console.log(
        "click event, getNodeAt returns: " +
        this.getNodeAt(params.pointer.DOM)
    );

    let activeNodeId = this.getNodeAt(params.pointer.DOM);

    /**
     * A node has been clicked
     */
    if (activeNodeId) {
        // var newColor = "#" + Math.floor(Math.random() * 255 * 255 * 255).toString(16);
        let activeNode = nodes.get(activeNodeId);
        
        console.log(activeNode);

        activeNode.tokens[tokenTypes.TOKEN_TYPE_IN].push(getToken());
 
        nodes.update([{ id: activeNodeId, label: getNodeLabel(activeNode) }]);


    };

});