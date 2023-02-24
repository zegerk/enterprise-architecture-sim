import { getToken } from "./tokens.js";

/**
 * @todo a bit crude.
 * 
 * @param {*} node 
 * @returns 
 */
const getNodeLabel = ({ node, simTime }) => {

    const MAX_LABEL_ROWS = 5;

    let label = `_${node.name}_\n[Cores: ${node.cores}]\n`;
    let rowIdx = 0;

    Object.entries(node.tokens).forEach((nodeTokenType) => {
        let [tokenType] = nodeTokenType;

        const count = node.tokens[tokenType].length;
        let age = 0;

        if (count) {
            age = simTime - node.tokens[tokenType].reduce(
                (accumulator, token) =>
                    accumulator + token.created, 0
            ) / count;

            label += `${tokenType} : ${count} ${Math.round(age)} \n`;
            rowIdx++;
        }
    });

    for (let i = 0; i < (MAX_LABEL_ROWS - rowIdx); i++) {
        /**
         * Vertical alignment is not yet possible
         */
        label += `\n`;
    }

    const averageLoad = node.load.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
    ) / node.load.length;

    const cpuLoad = Math.round((averageLoad / node.cores) * 100);

    label += `Load ${cpuLoad}%\n`;

    return label;
}

/**
 * Match 2 tokens on id and create a new one
 * 
 * @todo this is not a good way to do this
 */
const mergeTokens = ({ node, tokensFrom, tokenTo, simTime }) => {

    const [tokenTypeA, tokenTypeB] = tokensFrom;

    if (!node.tokens[tokenTypeA].length || !node.tokens[tokenTypeB].length) {
        return
    }
    
    node.tokens[tokenTypeA].forEach((tokenA, indexTokenA) => {

        const indexTokenB = node.tokens[tokenTypeB].findIndex(
            (tokenB) => tokenB.id === tokenA.id
        );

        /**
         * Found a match!
         */
        if (indexTokenB !== -1) {
            node.tokens[tokenTo].push(getToken({ simTime }));

            node.tokens[tokenTypeA][indexTokenA] = false;
            node.tokens[tokenTypeB][indexTokenB] = false;
        }
    })

    /**
     * Remove the timed out tokens
     */
    node.tokens[tokenTypeA] =
        node.tokens[tokenTypeA].filter((node) => node !== false);

    node.tokens[tokenTypeB] =
        node.tokens[tokenTypeB].filter((node) => node !== false);

}

/**
 * Timeout tokens
 */
const timeoutTokens = ({ node, tokenFrom, tokenTo, timeout, simTime }) => {

    if (!node.tokens[tokenFrom].length) {
        return
    }
    
    node.tokens[tokenFrom].forEach((token, index) => {
        /**
         * Simulated "timeout" on tokens
         */
        if (simTime - token.received > timeout) {

            node.tokens[tokenTo].push(
                node.tokens[tokenFrom][index]
            );

            /**
             * Prep the token for removal
             */
            node.tokens[tokenFrom][index] = false

        }
    })

    /**
     * Remove the timed out tokens
     */
    node.tokens[tokenFrom] =
        node.tokens[tokenFrom].filter((node) => node !== false);

}

export { getNodeLabel, mergeTokens, timeoutTokens };