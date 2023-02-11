// create an array with nodes
var nodes = new vis.DataSet([
    { id: 1, label: "Node 1", tokens: 0, _tempTokens: 0 },
    { id: 2, label: "Node 2", tokens: 0, _tempTokens: 0 },
    { id: 3, label: "Node 3", tokens: 0, _tempTokens: 0 },
    { id: 4, label: "Node 4", tokens: 0, _tempTokens: 0 },
    { id: 5, label: "Node 5", tokens: 0, _tempTokens: 0 },
    { id: 6, label: "Node 6", tokens: 0, _tempTokens: 0 },
]);

// create an array with edges
/**
 * To make lookups really easy use from - to as primary key
 */
var edges = new vis.DataSet([
    { id: '1-3', from: 1, to: 3, arrows: 'to' },
    { id: '1-2', from: 1, to: 2, arrows: 'to' },
    { id: '2-4', from: 2, to: 4, arrows: 'to' },
    { id: '2-5', from: 2, to: 5, arrows: 'to' },
    { id: '4-6', from: 4, to: 6, arrows: 'to' },
    { id: '5-6', from: 5, to: 6, arrows: 'to' },
    { id: '6-3', from: 6, to: 3, arrows: 'to' },
]);

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
    console.log('tick');

    nodes.forEach((node) => {

        let tokens  = node.tokens;

        /** 
         * Send the tokens, store the sent tokens in temp variable
         * so the will not be sent again when the node is visted later
         * on in the forEach
         */
        network.getConnectedNodes(node.id, 'to').forEach((activeNodeId) => { 

            /**
             * Get the edge
             */
            let activeEdge = edges.get(node.id + '-' + activeNodeId);

            /**
             * Any tokens left on source?
             */           
            if (tokens) {
                tokens--;
                
                let activeNode = nodes.get(activeNodeId);
                let activeNodeTokens = activeNode._tempTokens;

                activeNodeTokens++;
                
                nodes.update([{ id: activeNodeId, _tempTokens: activeNodeTokens }]);

                edges.update([{ id: activeEdge.id, color: 'red' }])
            } else {
                /**
                 * Edge not active this round
                 */
                edges.update([{ id: activeEdge.id, color: 'black' }])
            }
        });

        nodes.update([{ id: node.id, tokens }]);
    });

    nodes.forEach((activeNode) => {
        let tokens = activeNode.tokens + activeNode._tempTokens;
        let label = `Tokens ${tokens}\n${activeNode.id}`;
    
        nodes.update([{ id: activeNode.id, tokens, _tempTokens: 0, label }]);    
    });



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
        let tokens = activeNode.tokens++;
        let label = `Tokens ${tokens}`;
        
        nodes.update([{ id: activeNodeId, label }]);


    };

});