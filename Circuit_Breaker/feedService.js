const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const {Redis} = require('ioredis');

const {connectDatabaseCB} = require("./circuitBreakerDb");
const {circuitBreakerSchema} = require("./circuitBreakerSchema");

const circuitBreakerDB = connectDatabaseCB().model("CB", circuitBreakerSchema);

const HOST = 'http://localhost';
const FEED_PORT = 3000;  
const POST_PORT = 3001;
const PROFILE_PORT = 3002;

const FEED_CHANNEL = "feedService";
const POST_CHANNEL = "postService";
const PROFILE_CHANNEL = "profileService";

const redis = new Redis();
const consumer = new Redis();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

let feedServiceHealth = "true", postServiceHealth = "true", profileServiceHealth = "true";

let newHealthConfig = {
    "feedServiceHealth": feedServiceHealth,
    "postServiceHealth": postServiceHealth,
    "profileServiceHealth": profileServiceHealth
};

consumer.subscribe(FEED_CHANNEL);
consumer.subscribe(POST_CHANNEL);
consumer.subscribe(PROFILE_CHANNEL);

consumer.on('message', async (channel, message) => {
    switch(channel) {

        case FEED_CHANNEL:
            const newFeedServiceHealth = JSON.parse(message);
            feedServiceHealth = newFeedServiceHealth.health;

            newHealthConfig.feedServiceHealth = feedServiceHealth;
            await redis.set("feedService", JSON.stringify(newHealthConfig));
            await redis.expire('feedService', 120);

            break;
        
        case POST_CHANNEL:
            const newPostServiceHealth = JSON.parse(message);
            postServiceHealth = newPostServiceHealth.health;

            newHealthConfig.postServiceHealth = postServiceHealth;
            await redis.set("feedService", JSON.stringify(newHealthConfig));
            await redis.expire('feedService', 120);

            break;
        
        case PROFILE_CHANNEL:
            const newProfileServiceHealth = JSON.parse(message);
            profileServiceHealth = newProfileServiceHealth.health;

            newHealthConfig.profileServiceHealth = profileServiceHealth;
            await redis.set("feedService", JSON.stringify(newHealthConfig));
            await redis.expire('feedService', 120);

            break;
        
        default:
            console.log(`Received message from unknown channel: ${channel}`);
            break;
    }
});

async function isServiceHealthy(serviceName) {
    const serviceObject = await circuitBreakerDB.findOne({serviceName: serviceName});
    const isFeedServiceHealth = serviceObject.serviceHealth;
    return isFeedServiceHealth;
}

const handleUnhealthyService = (res, serviceName) => {
    return res.status(200).json({"Msg": `${serviceName} is Unhealthy. Returning Default Response`});
};

app.get("/warmup", (req, res) => {
    res.status(200).json({
        "msg": "Feed Server - Warmup Call working"
    });
});

app.get("/feed/:authorId", async (req, res) => {

    let healthConfig = await redis.get("feedService");
    healthConfig = JSON.parse(healthConfig);

    if(healthConfig) {
        feedServiceHealth = healthConfig.feedServiceHealth;
        postServiceHealth = healthConfig.postServiceHealth;
        profileServiceHealth = healthConfig.profileServiceHealth;
    }else {

        feedServiceHealth = await isServiceHealthy("feedService");
        postServiceHealth = await isServiceHealthy("postService");
        profileServiceHealth = await isServiceHealthy("profileService");

        newHealthConfig.feedServiceHealth = feedServiceHealth;
        newHealthConfig.postServiceHealth = postServiceHealth;
        newHealthConfig.profileServiceHealth = profileServiceHealth;

        await redis.set("feedService", JSON.stringify(newHealthConfig));
        await redis.expire('feedService', 120);
    }

    if(feedServiceHealth === "false") {
        return handleUnhealthyService(res, "feedService");
    }

    if(postServiceHealth === "false") {
        return handleUnhealthyService(res, "postService");
    }

    if(profileServiceHealth === "false") {
        return handleUnhealthyService(res, "profileService");
    }

    const authorId = req.params.authorId;
    const authorPosts = await axios.get(`${HOST}:${POST_PORT}/getAuthorPost/${authorId}`);
    const authorProfile = await axios.get(`${HOST}:${PROFILE_PORT}/getAuthorProfile/${authorId}`);

    if(authorProfile.data.Msg === "Unhealthy") {
        return handleUnhealthyService(res, "profileDbService");
    }

    if(authorPosts.data.Msg === "Unhealthy") {
        return handleUnhealthyService(res, "postDbService");
    }

    const authorFeed = {
        "Profile": authorProfile.data.AuthorProfile,
        "Posts": authorPosts.data.AuthorPosts,
    };

    res.status(200).json({"UserFeed": authorFeed});
});

app.listen(FEED_PORT, () => console.log(`Feed Server is running on port ${FEED_PORT}`));