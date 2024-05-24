const cluster = require('cluster');
const os = require('os');
const express = require('express');

const totalCPU = os.availableParallelism();

if(cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    for(let i = 0; i < totalCPU; i ++) {
        cluster.fork();
    }
} else {
    const app = express();
    app.get('/', (req, res) => {
        res.status(200).json({"msg": `Server is running on the process ${process.pid}`});
    });
    app.listen(0, () => console.log(`Server is running on port 0 on the process ${process.pid}`));
}

/* 
2 issues:
a) Only useful when have great hardware or doing vertical scaling
b) In windows, non uniform distribution of loads. traffic goes to mostly 2 workers out of 8.(if have 8 core CPU).
*/