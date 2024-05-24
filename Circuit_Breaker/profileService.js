const express = require('express');
const bodyParser = require('body-parser');
const {Redis} = require('ioredis');

const {connectDatabaseProfile} = require("./profileDb");
const {profileSchema} = require("./profileSchema");
const profileDb = connectDatabaseProfile().model("Profiles", profileSchema);

const {connectDatabaseCB} = require("./circuitBreakerDb");
const {circuitBreakerSchema} = require("./circuitBreakerSchema");
const circuitBreakerDB = connectDatabaseCB().model("CB", circuitBreakerSchema);

const redis = new Redis();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

async function isServiceHealthy(serviceName) {
    const serviceObject = await circuitBreakerDB.findOne({serviceName: serviceName});
    const isFeedServiceHealth = serviceObject.serviceHealth;
    return isFeedServiceHealth;
}

app.get("/warmup", (req, res) => {
    res.status(200).json({
        "msg": "Profile Server - Warmup Call working"
    });
});

app.post("/createProfile", async (req, res) => {
    const {authorId, name, age, address, phoneNumber} = req.body;
    const newProfile = await profileDb.create({
        authorId: authorId,
        name: name,
        age: age,
        address: address,
        phoneNumber: phoneNumber
    });
    res.status(200).json({
        "msg": `New Profile created for the User ${authorId} with Profile Id ${newProfile._id}`
    });
});

app.get("/getAuthorProfile/:authorId", async (req, res) => {

    let profileDBServiceHealth;

    let healthConfig = await redis.get("profileService");
    healthConfig = JSON.parse(healthConfig);

    if(healthConfig) {
        profileDBServiceHealth = healthConfig.profileDBServiceHealth;
    }else {
        profileDBServiceHealth = await isServiceHealthy("profileDB");
        const newHealthConfig = {
            "profileDBServiceHealth": profileDBServiceHealth,
        };

        await redis.set("profileService", JSON.stringify(newHealthConfig));
        await redis.expire('profileService', 120);
    }

    if(profileDBServiceHealth === false) {
        return res.status(200).json({"Msg": "Unhealthy"});
    }

    const authorId = req.params.authorId;
    const authorProfile = await profileDb.findOne({authorId: authorId});
    res.status(200).json({
        "AuthorProfile": authorProfile
    });
});

app.listen(3002, () => console.log('Profile Server is running on port 3002'));