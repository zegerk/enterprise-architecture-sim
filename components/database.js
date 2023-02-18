import { tokenTypes } from '../core/tokens.js';
import { timeoutTokens } from '../core/node.js';

const TIMEOUT_DB = 5;

/**
 * Convert db token to out token
 */
const process = ({ nodes }) => ({ node, simTime }) => {

    timeoutTokens({
        node,
        tokenFrom: tokenTypes.TOKEN_TYPE_DB, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
        timeout: TIMEOUT_DB,
        simTime
    })

    /**
     * Return false if nothing to do, used for "cpu" usage
     */
    if (!node.tokens[tokenTypes.TOKEN_TYPE_DB].length) {
        return false;
    }

    const token = node.tokens[tokenTypes.TOKEN_TYPE_DB].shift();
    node.tokens[tokenTypes.TOKEN_TYPE_RES].push(token);

    /**
     * Active
     */
    return true;
}

export { process }