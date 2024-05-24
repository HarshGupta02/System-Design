const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

const QUEUE_NAME = 'tasks';
const IDLE_QUEUE_NAME = 'idle_tasks';

async function connectProducer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();

        await channel.deleteQueue(QUEUE_NAME);
        await channel.deleteQueue(IDLE_QUEUE_NAME);
 
        await channel.assertQueue(QUEUE_NAME, {
            durable: false
        });
        await channel.assertQueue(IDLE_QUEUE_NAME, {
            durable: false,
            arguments: {
                'x-message-ttl': 120000
            }
        });

        app.post('/produce', async (req, res) => {
            const message = req.body.message;
            await channel.sendToQueue(QUEUE_NAME, Buffer.from(message));
            await channel.sendToQueue(IDLE_QUEUE_NAME, Buffer.from(message));
            res.status(200).json({"msg":  "Message Send to RabbitMQ Queue"});
        });

        app.listen(3000, () => console.log("Producer is running on port 3000"));

    } catch (error) {
        console.log(error);
    }
}

connectProducer();