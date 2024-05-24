const express = require('express');
const bodyParser = require('body-parser');
const {connectDatabaseCB} = require("./circuitBreakerDb");
const {circuitBreakerSchema} = require("./circuitBreakerSchema");

const circuitBreakerDB = connectDatabaseCB().model("CB", circuitBreakerSchema);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get("/warmup", (req, res) => {
    res.status(200).json({
        "msg": "Circuit Breaker Server - Warmup Call working"
    });
});

app.post("/createServiceConfig", async (req, res) => {
    const {serviceName, serviceHealth} = req.body;
    const newServiceConfig = await circuitBreakerDB.create({
        serviceName: serviceName,
        serviceHealth: serviceHealth
    });
    res.status(200).json({
        "msg": `New Service Config created for Service ${serviceName} with health as ${serviceHealth} with Id: ${newServiceConfig._id}`
    });
});

app.patch("/updateServiceConfig", async (req, res) => {
    const {serviceName, newServiceHealth} = req.body;
    await circuitBreakerDB.updateOne(
        {serviceName: serviceName},
        {$set: {serviceHealth: newServiceHealth}}
    );
    res.status(200).json({
        "msg": `Updated Service Config for Service ${serviceName} with updated health as ${newServiceHealth}`
    });
});

app.get("/getServiceConfig", async (req, res) => {
    const {serviceName} = req.body;
    const serviceHealth = await circuitBreakerDB.findOne({serviceName: serviceName});
    res.status(200).json({
        "Service_Name": serviceName, 
        "Service_Health": serviceHealth
    });
});

app.listen(3003, () => console.log('Profile Server is running on port 3003'));