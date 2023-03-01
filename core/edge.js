const getEdgeLabel = ({ edge }) => {

    const bandwidth = edge.bandwidth ?? 1;

    let label = ``;

    
    edge.tokenTypes.forEach( (tokenType) => {
        label += `${tokenType}\n`;
    });

    /**
     * Compute the average load of the edge
     */
    const averageLoad = edge.load.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
    ) / edge.load.length;

    label += Math.round(100 * (averageLoad / bandwidth)) + '%';

    return label;
}

export { getEdgeLabel }
