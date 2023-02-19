import { getToken, tokenTypes } from '../core/tokens.js';
import { timeoutTokens, mergeTokens } from '../core/node.js';

const USER_TIMEOUT = 5;
const USER_WAIT_TIMEOUT = 30;

const process = ({ nodes }) => ({ node, simTime, coreId }) => {

    if (coreId < 2) {
        /**
         * Create a token every tick, the token is duplicated to a 
         * waiting user token so we can match its unique id later with
         * the response token
         */
        const tokenReq = getToken({ simTime });
        const tokenWait = getToken({ simTime });

        tokenWait.id = tokenReq.id;

        node.tokens[tokenTypes.TOKEN_TYPE_REQ].push(tokenReq);
        node.tokens[tokenTypes.TOKEN_TYPE_WAIT].push(tokenWait);
    }

    timeoutTokens({ 
        node, 
        tokenFrom: tokenTypes.TOKEN_TYPE_REQ, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
        timeout: USER_TIMEOUT,
        simTime,
    });

    timeoutTokens({ 
        node, 
        tokenFrom: tokenTypes.TOKEN_TYPE_WAIT, tokenTo: tokenTypes.TOKEN_TYPE_FAIL,
        timeout: USER_WAIT_TIMEOUT,
        simTime,
    });

    mergeTokens({
        node,
        tokensFrom: [tokenTypes.TOKEN_TYPE_RES, tokenTypes.TOKEN_TYPE_WAIT],
        tokenTo: tokenTypes.TOKEN_TYPE_DONE,
        simTime
    })

    return true;
}

export { process };