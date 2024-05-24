const http = require('http');
const roundRobin = require('./roundRobin');
const leastConnections = require('./leastConnections');
const serverConfig = require('./config.json').servers;

const servers = serverConfig.map(server => ({
    ...server,
    connections: 0
}));

const loadBalancingAlgorithm = 'leastConnections';

// The LB Server acts as a reverse Proxy Server
const server = http.createServer((req, res) => {
    if(loadBalancingAlgorithm === 'roundRobin') {
        roundRobin(servers, req, res);
    }else if(loadBalancingAlgorithm === 'leastConnections') {
        leastConnections(servers, req, res);
    }else {
        res.writeHead(500);
        res.end('Load Balancing Algorithm is not supported');
    }
});

server.listen(3000, () => console.log('Load Balancer is running on port 3000'));