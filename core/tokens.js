/**
 * Enum for token types
 */
const tokenTypes = {
    TOKEN_TYPE_REQ: 'request',
    TOKEN_TYPE_API: 'api',
    TOKEN_TYPE_DB: 'db',
    TOKEN_TYPE_RES: 'response',
    TOKEN_TYPE_FAIL: 'fail',
    TOKEN_TYPE_WAIT: 'wait',
    TOKEN_TYPE_DONE: 'done',
}

/**
 * Tokens factory for the nodes
 * 
 * @todo this is "suboptimal"
 */
const getTokens = () => {
    return {
        [tokenTypes.TOKEN_TYPE_REQ]: [],
        [tokenTypes.TOKEN_TYPE_API]: [],
        [tokenTypes.TOKEN_TYPE_DB]: [],
        [tokenTypes.TOKEN_TYPE_RES]: [],
        [tokenTypes.TOKEN_TYPE_FAIL]: [],
        [tokenTypes.TOKEN_TYPE_WAIT]: [],
        [tokenTypes.TOKEN_TYPE_DONE]: [],
    };
}

/**
 * Store the history of the tokens so we can use it for graphs
 * or other analyses
 */
const getTokensHistory = () => {
    return {
        [tokenTypes.TOKEN_TYPE_REQ]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_API]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_DB]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_RES]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_FAIL]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_WAIT]: new vis.DataSet(),
        [tokenTypes.TOKEN_TYPE_DONE]: new vis.DataSet(),
    };
}

/**
 * Token factory
 * 
 * Creates a token with a unique id
 */
const getToken = ({ simTime }) => {

    // Being lazy here
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    function makeid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
    

    return {
        created: simTime,
        /**
         * Timestamp when the token entered the node
         */
        received: simTime,
        id: makeid(8),
    };
}

export { tokenTypes, getTokens, getToken, getTokensHistory };