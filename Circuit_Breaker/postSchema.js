const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    authorId: {
        type: Number,
        required: [true, "Please Enter the Author Id"]
    },
    title: {
        type: String,
        required: [true, "Please Enter Post Title"]
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date
    }
});

module.exports = {postSchema};