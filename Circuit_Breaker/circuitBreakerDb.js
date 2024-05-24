const mongoose = require('mongoose');

const connectDatabaseCB = () => {
    mongoose.set("strictQuery", true);
    const circuitBreakerDB = mongoose.createConnection("mongodb+srv://harshgupta:codemongodb@cluster0.ay9jwss.mongodb.net/cb?retryWrites=true&w=majority&appName=Cluster0");
    return circuitBreakerDB;
}

module.exports = {connectDatabaseCB};