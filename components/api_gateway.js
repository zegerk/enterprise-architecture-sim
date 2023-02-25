import { tokenTypes } from '../core/tokens.js';
import { timeoutTokens, convertTokens } from '../core/node.js';

const TIMEOUT_API_GATEWAY = 5;

const componentConfig = [
    {
        operator: timeoutTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_REQ, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
            timeout: TIMEOUT_API_GATEWAY,
        }
    },
    {
        operator: timeoutTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_API, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
            timeout: TIMEOUT_API_GATEWAY,
        }
    },  
    {
        operator: convertTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_REQ, tokenTo: tokenTypes.TOKEN_TYPE_API,
        }
    },       
]

/**
 * The API converts "in" tokens to validated "api" request tokens
 * 
 * @todo timeouts should be "houskeeping" or OS level -
 */
const process = ({ nodes }) => ({ node, simTime }) => {
    
    let processResult = false;

    componentConfig.forEach( ({ operator, config }) => {
        /**
         * Add node and config to call function parameter
         */
        processResult = operator({ ...config, node, simTime }) || processResult;
    });

    return processResult;
}

export { process }