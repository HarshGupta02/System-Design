const Redis = require('ioredis');
const channel = process.argv[2];

const redis = new Redis();

redis.subscribe(channel);

redis.on('message', (channel, message) => {
    console.log(`Received message from ${channel}: ${message}`);
});

console.log('Consumer is running...');