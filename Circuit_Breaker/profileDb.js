const mongoose = require('mongoose');

const connectDatabaseProfile = () => {
    mongoose.set("strictQuery", true);
    const profileDB = mongoose.createConnection("mongodb+srv://harshgupta:codemongodb@cluster0.ay9jwss.mongodb.net/profile?retryWrites=true&w=majority&appName=Cluster0");
    return profileDB;
}

module.exports = {connectDatabaseProfile};