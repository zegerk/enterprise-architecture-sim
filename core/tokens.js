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
 * Token factory
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

export { tokenTypes, getTokens, getToken };