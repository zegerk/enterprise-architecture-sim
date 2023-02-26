import { tokenTypes } from '../core/tokens.js';
import { timeoutTokens, mergeTokens, createAndCloneToken, randomProcess } from '../core/node.js';

const USER_TIMEOUT = 5;
const USER_WAIT_TIMEOUT = 30;

const componentConfig = [
    {
        /**
         * randomProcess is a wrapper function
         */
        operator: randomProcess,
        config: {
            probability: 0.15,
            processConfig:{
                operator: createAndCloneToken,
                config: {
                    tokenCreate: tokenTypes.TOKEN_TYPE_REQ, tokenClone: tokenTypes.TOKEN_TYPE_WAIT,
                }
            }                        
        }
    },
    {
        operator: timeoutTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_REQ, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
            timeout: USER_TIMEOUT,
        }
    },  
    {
        operator: timeoutTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_WAIT, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
            timeout: USER_WAIT_TIMEOUT,
        }
    },      
    {
        operator: mergeTokens,
        config: {
            tokensFrom: [tokenTypes.TOKEN_TYPE_RES, tokenTypes.TOKEN_TYPE_WAIT], tokenTo: tokenTypes.TOKEN_TYPE_DONE,
        }
    },       
]

export { componentConfig };