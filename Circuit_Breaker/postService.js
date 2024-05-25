const express = require('express');
const bodyParser = require('body-parser');
const {Redis} = require('ioredis');

const {connectDatabasePost} = require("./postDb");
const {postSchema} = require("./postSchema");
const postDB = connectDatabasePost().model("Posts", postSchema);

const {connectDatabaseCB} = require("./circuitBreakerDb");
const {circuitBreakerSchema} = require("./circuitBreakerSchema");
const circuitBreakerDB = connectDatabaseCB().model("CB", circuitBreakerSchema);

const POST_DB_CHANNEL = "postDB";

const redis = new Redis();
const consumer = new Redis();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

let postDBServiceHealth = "true";

let newHealthConfig = {
    "postDbServiceHealth": postDBServiceHealth,
};

consumer.subscribe(POST_DB_CHANNEL);

consumer.on('message', async (channel, message) => {
    switch(channel) {

        case POST_DB_CHANNEL:

            const newPostDbServiceHealth = JSON.parse(message);
            postDBServiceHealth = newPostDbServiceHealth.health;

            newHealthConfig.postDbServiceHealth = postDBServiceHealth;
            await redis.set("postService", JSON.stringify(newHealthConfig));
            await redis.expire('postService', 120);

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

app.get("/warmup", (req, res) => {
    res.status(200).json({
        "msg": "Post Server - Warmup Call working"
    });
});

app.post("/createPost", async (req, res) => {
    const {authorId, title, description} = req.body;
    const newPost = await postDB.create({
        authorId: authorId,
        title: title,
        description: description,
        createdAt: Date.now()
    });
    res.status(200).json({
        "msg": `New Post created for the User ${authorId} with postId as ${newPost._id}`
    });
});

app.get("/getAuthorPost/:authorId", async (req, res) => {

    let healthConfig = await redis.get("postService");
    healthConfig = JSON.parse(healthConfig);

    if(healthConfig) {
        postDBServiceHealth = healthConfig.postDbServiceHealth;
    }else {
        postDBServiceHealth = await isServiceHealthy("postDB");
        
        newHealthConfig.postDbServiceHealth = postDBServiceHealth;

        await redis.set("postService", JSON.stringify(newHealthConfig));
        await redis.expire('postService', 120);
    }

    if(postDBServiceHealth === "false") {
        return res.status(200).json({"Msg": "Unhealthy"});
    }

    const authorId = req.params.authorId;
    const authorPosts = await postDB.find({authorId: authorId});
    res.status(200).json({
        "AuthorPosts": authorPosts
    });
});

app.listen(3001, () => console.log('Post Server is running on port 3001'));