const {kafka} = require('./client');

async function init() {
    try {
        const admin = kafka.admin();
        await admin.connect();
        await admin.createTopics({
            topics: [{
                topic: "rider-updates",
                numPartitions: 2
            }]
        });
        await admin.disconnect();
    } catch (error) {
        console.log(error);
    }
}

init();