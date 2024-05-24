const {Kafka} = require('kafkajs');

exports.kafka = new Kafka({
    'clientId': "Demo Kafka",
    'brokers': ["172.29.224.1:9092"]
});