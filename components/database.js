import { tokenTypes } from '../core/tokens.js';
import { timeoutTokens, convertTokens } from '../core/node.js';

const TIMEOUT_DB = 5;

const componentConfig = [
    {
        operator: timeoutTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_DB, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
            timeout: TIMEOUT_DB,
        }
    },
    {
        operator: convertTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_DB, tokenTo: tokenTypes.TOKEN_TYPE_RES,
        }
    },       
]

export { componentConfig }