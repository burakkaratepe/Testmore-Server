const iOSLib = require('node-ios-device');
const androidlib = require("androidlib").devices;

const deviceType = {
    iOS: "iOS",
    Android: "Android"
};

const testStatus = {
    RUNNING: "Running",
    NO_TEST_RUN: "There is no test run on queue.",
    NOT_ABLE_TO_START: "The Appium Driver is not create.",
}

async function getDevices() {
    return new Promise((resolve, reject) => {
        let iOSDevices = iOSLib.list();
        androidlib.getDevices().then((androidDevices) => {
            for (let i = 0; i < androidDevices.length; i++) {
                androidDevices[i].udid = androidDevices[i].id
                delete androidDevices[i].id;
            }
            resolve(iOSDevices.concat(androidDevices))
        });
    });
};

async function startTestOnMobileDevice(device) {
    return new Promise((resolve, reject) => {
        const path = require("path");
        const { spawn } = require("child_process");
        const bearerToken = "44|sRLl4auCdhiAVzwdYkBMBYFV4Nr7yTr4IWmSXoE3";
        console.log("Test run is starting for -> " + device.name + " (" + device.os_version + ") on port 4723");
        let args = [
            "-jar",
            path.join("assets", "jar", "testmore.jar"),
            "1",
            device.udid,
            4723,
            bearerToken
        ];
        const testProcess = spawn("java", args);
        console.log(testProcess);
        testProcess.stdout.on("data", (data) => {
            if (data.toString().includes("Test Id")) {
                const testState = {
                    testId: data.toString().substr(data.toString().lastIndexOf(" ") + 1),
                    status: testStatus.RUNNING,
                }
                resolve(testState);
            } else if (data.toString().includes(testStatus.NO_TEST_RUN)) {
                const testState = {
                    status: testStatus.NO_TEST_RUN,
                }
                reject(testState);
            } else if (data.toString().includes(testStatus.NOT_ABLE_TO_START)) {
                const testState = {
                    status: testStatus.NOT_ABLE_TO_START,
                }
                reject(testState);
            }
            console.log(`stdout: ${data}`);
        });

        testProcess.on('close', (code) => {
            console.log(`test run is exited with code ${code}`);
        });
    });
}

module.exports = { getDevices, startTestOnMobileDevice };