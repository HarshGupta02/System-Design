const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const {connectDatabaseCB} = require("./circuitBreakerDb");
const {circuitBreakerSchema} = require("./circuitBreakerSchema");

const circuitBreakerDB = connectDatabaseCB().model("CB", circuitBreakerSchema);

const HOST = 'http://localhost';
const FEED_PORT = 3000;  
const POST_PORT = 3001;
const PROFILE_PORT = 3002;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

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

    const feedServiceHealth = await isServiceHealthy("feedService");
    if(feedServiceHealth === false) {
        return handleUnhealthyService(res, "feedService");
    }

    const authorId = req.params.authorId;

    const postServiceHealth = await isServiceHealthy("postService");
    if(postServiceHealth === false) {
        return handleUnhealthyService(res, "postService");
    }
    const authorPosts = await axios.get(`${HOST}:${POST_PORT}/getAuthorPost/${authorId}`);

    const profileServiceHealth = await isServiceHealthy("profileService");
    if(profileServiceHealth === false) {
        return handleUnhealthyService(res, "profileService");
    }
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