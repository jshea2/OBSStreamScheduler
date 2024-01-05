const OBSWebSocket = require('obs-websocket-js');
const schedule = require('node-schedule');
const fs = require('fs');

const obs = new OBSWebSocket();
obs.connect({
    address: '127.0.0.1:4455', // Update with your OBS WebSocket address and port
    password: 'secret'         // Update with your OBS WebSocket password
}).then(() => {
    console.log("Connected to OBS");
}).catch(err => {
    console.error('Error connecting to OBS:', err);
});

let jobs = [];

function loadSchedules() {
    // Cancel all existing scheduled jobs
    jobs.forEach(job => job.cancel());
    jobs = [];

    // Read and parse the updated configuration file
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

    // Schedule new jobs
    config.schedules.forEach(sch => {
        const startStreamingTime = new Date(sch.startTime);
        const stopStreamingTime = new Date(sch.stopTime);

        // Schedule start streaming
        const startJob = schedule.scheduleJob(startStreamingTime, function() {
            obs.send('StartStreaming').then(() => {
                console.log(`Streaming started at ${sch.startTime}`);
            }).catch(err => {
                console.error('Failed to start streaming:', err);
            });
        });

        // Schedule stop streaming
        const stopJob = schedule.scheduleJob(stopStreamingTime, function() {
            obs.send('StopStreaming').then(() => {
                console.log(`Streaming stopped at ${sch.stopTime}`);
            }).catch(err => {
                console.error('Failed to stop streaming:', err);
            });
        });

        jobs.push(startJob, stopJob);
    });
}

// Initial load of schedules
loadSchedules();

// Watch the config file for changes
fs.watch('config.json', (eventType, filename) => {
    if (filename && eventType === 'change') {
        console.log('Config file changed. Reloading schedules...');
        loadSchedules();
    }
});

