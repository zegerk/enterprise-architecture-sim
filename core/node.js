import { getToken } from "./tokens.js";

/**
 * @todo a bit crude.
 * 
 * @param {*} node 
 * @returns 
 */
const getNodeLabel = ({ node, simTime }) => {

    const MAX_LABEL_ROWS = 8;

    let label = `_${node.name}_\n[Cores: ${node.cores}]\n`;
    let rowIdx = 0;

    /**
     * The node config itself for reference
     */
    if (node.processConfig) {
        node.processConfig.forEach( ({ operator, config }) => {
            label += `${operator.getNodeLabel(config)}\n`;
            rowIdx++;
        });
    }

    /**
     * List the tokens per type
     */
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

    /**
     * Vertical alignment is not yet possible, add empty lines
     * to put the final line at the bottom
     */
    for (let i = 0; i < (MAX_LABEL_ROWS - rowIdx); i++) {
        label += `\n`;
    }

    label += `Load ${node.cpuLoadCurrent}%\n`;

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
mergeTokens.getNodeLabel = (config) => {
    return `Merge ${config.tokensFrom} -> ${config.tokenTo}`;
}


/**
 * Timeout tokens
 */
const timeoutTokens = ({ node, tokenFrom, tokenTo, timeout, simTime }) => {

    if (!node.tokens[tokenFrom].length) {
        return false;
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

    return true;
}
timeoutTokens.getNodeLabel = (config) => {
    return `${config.tokenFrom} -> ${config.tokenTo} in [${config.timeout}]`;
}

const convertTokens = ({ node, tokenFrom, tokenTo }) => {
    /**
     * Return false if nothing to do, used for "cpu" usage
     */
    if (!node.tokens[tokenFrom].length) {
        return false;
    }

    const token = node.tokens[tokenFrom].shift();

    node.tokens[tokenTo].push(token);

    return true;
}
convertTokens.getNodeLabel = (config) => {
    return `${config.tokenFrom} -> ${config.tokenTo}`;
}

/**
 * Create a token and clone it (copy the id) 
 * 
 * The id can be used to match the token later one, example:
 * create request token and a wait token, then wait for the request
 * token to return and match the id
 */
const createAndCloneToken = ({ tokenCreate, tokenClone, node, simTime }) => {
    const createToken = getToken({ simTime });
    const cloneToken = getToken({ simTime });

    cloneToken.id = createToken.id;

    node.tokens[tokenCreate].push(createToken);
    node.tokens[tokenClone].push(cloneToken);
}
createAndCloneToken.getNodeLabel = (config) => {
    return `${config.tokenCreate} && ${config.tokenClone}`;
}

const randomProcess = (config) => {
    if ( Math.min( 1,
            Math.max( 0, config.probability )
        ) > Math.random()
    ) {
        /**
         * Call the encapsulated function and merge all arguments
         * 
         */
        return config.processConfig.operator({ ...config.processConfig.config, ...config});
    }

    return false;
}
randomProcess.getNodeLabel = ({ processConfig, probability }) => {
    return `P${probability} - ${processConfig.operator.getNodeLabel(processConfig.config)}`;
}

export { getNodeLabel, mergeTokens, randomProcess, createAndCloneToken, convertTokens, timeoutTokens };