import { tokenTypes } from '../core/tokens.js';
import { convertTokens } from '../core/node.js';

const componentConfig = [
    {
        operator: convertTokens,
        config: {
            tokenFrom: tokenTypes.TOKEN_TYPE_API, tokenTo: tokenTypes.TOKEN_TYPE_DB,
        }
    },       
]

export { componentConfig }