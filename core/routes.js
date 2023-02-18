
/**
 * Send the token to the first route
 */
const routeDefault = () => (nodes) => {
    return nodes.length ? [nodes[0]] : [];
}

/**
 * Send the token to a random route
 */
const routeRandom = () => (nodes) => {
    return nodes.length 
        ? [nodes[Math.floor(Math.random() * nodes.length)]] 
        : [];
}

export { routeDefault, routeRandom };