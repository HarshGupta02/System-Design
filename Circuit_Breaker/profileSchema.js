const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    authorId: {
        type: Number,
        required: [true, "Please Enter the Author Id"]
    },
    name: {
        type: String,
        required: [true, "Please Enter Your Name"]
    },
    age: {
        type:  Number,
        required: [true, "Please Enter Your Age"]
    },
    address: {
        type: String,
        required: [true, "Please Enter Your Address"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Please Enter Your Phone Number"]
    }
});

module.exports = {profileSchema};