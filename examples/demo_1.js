
import { process as processDb } from '../components/database.js';
import { process as processUser } from '../components/user.js';
import { process as processApiGateway } from '../components/api_gateway.js';
import { process as processApiService } from '../components/api_service.js';

import { tokenTypes } from '../core/tokens.js';
import { getTokens } from '../core/tokens.js';

/**
 * @todo split this in a generic loader and seperate data files
 */
import { routeDefault, routeRandom } from '../core/routes.js';

const loadNetwork = ({ nodes, edges }) => {

    loadNodes({ nodes });
    loadEdges({ edges });

    /**
     * Housekeeping
     */
    nodes.forEach((node) => {
        /**
         * Layout stuff
         */
        node.font = { multi: 'markdown' },
        node.margin = { top: 2, left: 2, bottom: 2, right: 2 };

        node.heightConstraint = { minimum: 100 };
        node.widthConstraint = { minimum: 100 };
    })

    /**
     * Edges houskeeping
     */
    edges.forEach((edge) => {
        edge.width = edge.bandwidth ? edge.bandwidth * 2 : 1;

        edge.arrows = {
            to: {
                enabled: true,
                type: 'arrow',
                scaleFactor: 0.5,
            }
        }
    })
}

const loadNodes = ({ nodes }) => {
    nodes.update([
        { id: 1, name: "users", 
            route: routeDefault(), process: processUser({ nodes }), 
            tokens: getTokens(), _tempTokens: getTokens(), 
            shape: 'box', color: 'lightgreen',
            cores: 4,
        },

        { id: 2, name: "api gateway", 
            route: routeRandom(), process: processApiGateway({ nodes }), 
            tokens: getTokens(), _tempTokens: getTokens(), 
            shape: 'box',
            cores: 4,
        },

        { id: 3, name: "Micro-service 1", 
            route: routeDefault(), process: processApiService({ nodes }),
            tokens: getTokens(), _tempTokens: getTokens(), shape: 'box' },
        { id: 4, name: "Micro-service 2", 
            route: routeDefault(), process: processApiService({ nodes }),
            tokens: getTokens(), _tempTokens: getTokens(), shape: 'box' },
        { id: 5, name: "Micro-service 3", 
            route: routeDefault(), process: processApiService({ nodes }),
            tokens: getTokens(), _tempTokens: getTokens(), shape: 'box' },
        
        { id: 6, name: "Database s1", route: routeDefault(), process: processDb({ nodes }), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
        { id: 7, name: "Database s2", route: routeDefault(), process: processDb({ nodes }), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
        { id: 8, name: "Database s3", route: routeDefault(), process: processDb({ nodes }), tokens: getTokens(), _tempTokens: getTokens(), shape: 'database' },
    ]);
}

const loadEdges = ({ edges }) => {
    edges.update([
        /**
         * Users to API gateways
         */
        { from: 1, to: 2,
          tokenTypes: [tokenTypes.TOKEN_TYPE_REQ],
          bandwidth: 4,
        },
        /**
         * API gateway to users
         */
        { from: 2, to: 1,
          tokenTypes: [tokenTypes.TOKEN_TYPE_RES],
          bandwidth: 4,
        },
        
        { from: 2, to: 3, tokenTypes: [tokenTypes.TOKEN_TYPE_API], bandwidth: 3, },
        { from: 3, to: 2, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3, },
        
        { from: 2, to: 4, tokenTypes: [tokenTypes.TOKEN_TYPE_API], bandwidth: 3, },
        { from: 4, to: 2, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3, },
        
        { from: 2, to: 5, tokenTypes: [tokenTypes.TOKEN_TYPE_API], bandwidth: 3 },
        { from: 5, to: 2, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3 },
        
        { from: 3, to: 6, tokenTypes: [tokenTypes.TOKEN_TYPE_DB], bandwidth: 3 },
        { from: 6, to: 3, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3 },
        
        { from: 4, to: 7, tokenTypes: [tokenTypes.TOKEN_TYPE_DB], bandwidth: 3 },
        { from: 7, to: 4, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3 },
        
        { from: 5, to: 8, tokenTypes: [tokenTypes.TOKEN_TYPE_DB], bandwidth: 3 },
        { from: 8, to: 5, tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 3 },
    ]);
}

const edgeConfig = {
    [tokenTypes.TOKEN_TYPE_REQ] : {
        color: 'black',
        colorActive: 'red',
    },
    [tokenTypes.TOKEN_TYPE_RES] : {
        color: 'gray',
        colorActive: 'green',
    },
    [tokenTypes.TOKEN_TYPE_API] : {
        color: 'maroon',
        colorActive: 'red',
    },    
    [tokenTypes.TOKEN_TYPE_DB] : {
        color: 'maroon',
        colorActive: 'red',
    },    
    [tokenTypes.TOKEN_TYPE_FAIL] : {
        color: 'gray',
        colorActive: 'green',
    },    
    [tokenTypes.TOKEN_TYPE_WAIT] : {
        color: 'gray',
        colorActive: 'pink',
    },    
    [tokenTypes.TOKEN_TYPE_DONE] : {
        color: 'gray',
        colorActive: 'yellow',
    }           
}

export { loadNetwork, edgeConfig };