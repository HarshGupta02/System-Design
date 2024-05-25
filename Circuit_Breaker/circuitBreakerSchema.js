const mongoose = require("mongoose");

const circuitBreakerSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, "Please Enter the Service Name"]
    },
    serviceHealth: {
        type: String,
        required: [true, "Please Enter the Service Health"]
    },
});

module.exports = {circuitBreakerSchema};