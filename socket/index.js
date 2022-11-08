const { Server } = require('ws');
const fs = require('fs');
const path = require('path');

const sockserver = new Server({ port: 443 });
sockserver.on('connection', (ws) => {
    console.log('New client connected!');
    ws.on('close', () => console.log('Client has disconnected!'));

    ws.on("message", (data) => {
        console.log(data);
    });

    sockserver.clients.forEach((client) => {
        const directoryPath = path.join(__dirname, "..", "assets", "Forest");
        fs.readdir(directoryPath, function (err, files) {
            files.forEach(function (file) {
                setTimeout(() => {
                    const data = JSON.stringify({ 'type': 'JPEG', 'base64': base64_encode(path.join(directoryPath, file)) });
                    client.send(data);
                }, 3000);
            });
        });
    });
});




// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}