import { tokenTypes } from '../core/tokens.js';
import { timeoutTokens } from '../core/node.js';

const TIMEOUT_API_GATEWAY = 5;

/**
 * The API converts "in" tokens to validated "api" request tokens
 */
const process = ({ nodes }) => ({ node, simTime }) => {
    
    timeoutTokens({
        node,
        tokenFrom: tokenTypes.TOKEN_TYPE_REQ, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
        timeout: TIMEOUT_API_GATEWAY,
        simTime,
    })

    timeoutTokens({
        node,
        tokenFrom: tokenTypes.TOKEN_TYPE_API, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
        timeout: TIMEOUT_API_GATEWAY,
        simTime,
    })

    /**
     * Return false if nothing to do, used for "cpu" usage
     */
    if (!node.tokens[tokenTypes.TOKEN_TYPE_REQ].length) {
        return false;
    }

    const token = node.tokens[tokenTypes.TOKEN_TYPE_REQ].shift();

    node.tokens[tokenTypes.TOKEN_TYPE_API].push(token);

    /**
     * Active
     */
    return true;
}

export { process }