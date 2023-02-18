
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
        node.cores = node.cores ?? 1;
        node.load = 0;
    })

    /**
     * Set the width accoring to the bandwidth
     */
    edges.forEach((edge) => {
        edge.width = edge.bandwidth ? edge.bandwidth * 2 : 1;
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
          arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_REQ],
          bandwidth: 2,
        },
        /**
         * API gateway to users
         */
        { from: 2, to: 1, arrows: 'to', 
          tokenTypes: [tokenTypes.TOKEN_TYPE_RES],
          bandwidth: 2,
        },
        
        { from: 2, to: 3, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_API], bandwidth: 2, },
        { from: 3, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 2, },
        
        { from: 2, to: 4, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_API], bandwidth: 2, },
        { from: 4, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES], bandwidth: 2, },
        
        { from: 2, to: 5, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_API] },
        { from: 5, to: 2, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES] },
        
        { from: 3, to: 6, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_DB] },
        { from: 6, to: 3, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES] },
        
        { from: 4, to: 7, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_DB] },
        { from: 7, to: 4, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES] },
        
        { from: 5, to: 8, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_DB] },
        { from: 8, to: 5, arrows: 'to', tokenTypes: [tokenTypes.TOKEN_TYPE_RES] },
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