import { tokenTypes } from '../core/tokens.js';

/**
 * Receive an API request and convert to database
 */
const process = ({ nodes }) => ({ node }) => {

    /**
     * Return false if nothing to do, used for "cpu" usage
     */
    if (!node.tokens[tokenTypes.TOKEN_TYPE_API].length) {
        return false;
    }

    const token = node.tokens[tokenTypes.TOKEN_TYPE_API].shift();
    node.tokens[tokenTypes.TOKEN_TYPE_DB].push(token);

    /**
     * Active
     */
    return true;
}

export { process }