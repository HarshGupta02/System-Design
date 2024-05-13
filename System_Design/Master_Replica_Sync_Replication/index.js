const express = require('express');
const bodyParser = require('body-parser');
const {connectDatabaseMaster, connectDatabaseReplica} = require('./db.js');
const {UserSchema} = require('./schema.js');

const masterDB = connectDatabaseMaster();
const replicaDB = connectDatabaseReplica();

const masterUser = masterDB.model('User', UserSchema);
const replicaUser = replicaDB.model('User', UserSchema);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/', (req, res) => {
    res.status(200).json({"msg": "Server is running"});
});

app.post('/createUser', async (req, res) => {
    const {name, phoneNumber} = req.body;
    const newMasterUser = await masterUser.create({ name: name, phoneNumber: phoneNumber });
    const newReplicaUser = await replicaUser.create({ name: name, phoneNumber: phoneNumber });
    res.status(200).json({"msg": `New User is created on Master with id ${newMasterUser._id} and on Replica with id ${newReplicaUser._id}`});
});

app.get('/allUsers', async (req, res) => {
    const users = await replicaUser.find();
    res.status(200).json({"Users": users});
});

app.listen(8000, () => console.log('Server is running on PORT 8000'));