const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Please Enter Your Phone Number"],
        unique: true
    },
    createdAt: {
        type: Date,
    }
});

module.exports = {UserSchema};