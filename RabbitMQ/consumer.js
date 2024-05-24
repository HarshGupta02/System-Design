const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

const QUEUE_NAME = 'tasks';

async function connectConsumer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.deleteQueue(QUEUE_NAME);
        await channel.assertQueue(QUEUE_NAME, {
            durable: false
        });

        console.log(`Consumer waiting for messages in ${QUEUE_NAME}`);

        channel.consume(QUEUE_NAME, (message) => {
            const dataReceived = message.content.toString();
            console.log(`Received: ${dataReceived}`);
            channel.ack(message);
        });

        app.listen(4000, () => console.log('Consumer is running on port 4000'));

    } catch (error) {
        console.log(error);
    }
}

connectConsumer();