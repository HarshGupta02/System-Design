const express = require('express');
const bodyParser = require('body-parser');
const { connectDatabaseMaster, connectDatabaseReplica } = require('./db');
const { UserSchema } = require('./schema');
const cron = require('node-cron');
const {Redis} = require('ioredis');

const masterDB = connectDatabaseMaster();
const replicaDB = connectDatabaseReplica();

const masterUser = masterDB.model("User", UserSchema);
const replicaUser = replicaDB.model("User", UserSchema);

const redis = new Redis();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

async function asyncReplication() {
    try {
        const latestCheckpoint = await replicaUser.findOne().sort({createdAt: -1});
        let filter = {};
        if(latestCheckpoint) filter.createdAt = {$gt: latestCheckpoint.createdAt};
        const newUsers = await masterUser.find(filter);
        await replicaUser.insertMany(newUsers);
        console.log('Data Pull from Master to Replica done successfully');
    } catch (error) {
        console.error('Error in Replication:', error);
    }
};

app.get('/', (req, res) => {
    res.status(200).json({"msg": "Server is running"});
});

app.post('/createUser', async (req, res) => {
    const {name, phoneNumber} = req.body;
    // Write through cache population
    const newMasterUser = await masterUser.create({
        name: name, 
        phoneNumber: phoneNumber,
        createdAt: Date.now()
    });
    const users = await masterUser.find();
    await redis.set("allUsers", JSON.stringify(users)); // redis and DB sync
    await redis.expire("allUsers", 30); // memory optimization
    res.status(200).json({"msg": `New User is created on Master with id ${newMasterUser._id}`});
});

app.get('/allUsers', async (req, res) => {
    // Lazy Loading cache population 
    let cached_users = await redis.get('allUsers'); // fetch latest data
    cached_users = JSON.parse(cached_users);
    if(cached_users) return res.status(200).json({"users": cached_users});
    const users = await replicaUser.find(); // scale new empty nodes.
    await redis.set('allUsers', JSON.stringify(users));
    await redis.expire('allUsers', 30);
    res.status(200).json({"users": users}); 
});

/* 
this approach is lazy loading + TTL =>
advantages: 1) Only 1 write request to DB.
            2) No stale data as TTL applied.
            3) Stores only the requested data.
            4) Optimize memory.
            5) If node fails so recovers by fetching latest data from DB.
*/

cron.schedule('* * * * *', () => {
    asyncReplication();
});

app.listen(8000, () => console.log('Server is running on port 8000'));