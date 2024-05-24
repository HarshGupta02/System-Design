const mongoose = require('mongoose');

const connectDatabasePost = () => {
    mongoose.set("strictQuery", true);
    const postDB = mongoose.createConnection("mongodb+srv://harshgupta:codemongodb@cluster0.ay9jwss.mongodb.net/post?retryWrites=true&w=majority&appName=Cluster0");
    return postDB;
}

module.exports = {connectDatabasePost};