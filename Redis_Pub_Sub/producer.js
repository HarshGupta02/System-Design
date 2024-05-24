const express = require('express');
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express();
const redis = new Redis();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true})); 

app.get('/', (req, res) => {
    res.status(200).json({'msg': 'Home route is running'});
});

app.post('/publish', (req, res) => {
    const {channel, message} = req.body;
    redis.publish(channel, JSON.stringify(message));
    res.status(200).json({'msg': 'Message Send Successfully'});
});

app.listen(8000, () => console.log('Publisher is running is on Port 8000'));