const mongoose = require("mongoose");

const connectDatabaseMaster = () => {
    mongoose.set("strictQuery", true);
    const masterDB = mongoose.createConnection("mongodb+srv://harshgupta:codemongodb@cluster0.ay9jwss.mongodb.net/master?retryWrites=true&w=majority&appName=Cluster0");
    return masterDB;
};

const connectDatabaseReplica = () => {
    mongoose.set("strictQuery", true);
    const replicaDB = mongoose.createConnection("mongodb+srv://harshgupta:codemongodb@cluster0.ay9jwss.mongodb.net/replica?retryWrites=true&w=majority&appName=Cluster0");
    return replicaDB;
};

module.exports = {connectDatabaseMaster, connectDatabaseReplica};