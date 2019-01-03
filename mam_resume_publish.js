const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const moment = require('moment');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });


//creation of the filesystem for later storing our mamState
var fs = require('fs');
// Initialise MAM State
var mamState = Mam.init(iota, undefined, 1);
mamState = Mam.changeMode(mamState, "public");

var readline = require('readline');
var rl = readline.createInterface( {
	input: process.stdin, 
	output: process.stdout
});

rl.question("Do you like to start a new channel (y/n)=", function(answer)  {
	if (answer === "y") {
		rl.close();
		console.log("ok start over again");
		executeDataPublishing(mamState)
	        setInterval(executeDataPublishing(mamState), 15*1000);
	} else if (answer ==="n") {
		rl.close();
		console.log("read the latest mamState");
		var mamState = JSON.parse(fs.readFileSync("mamState.json"));
		mamState = Mam.changeMode(mamState, "public");
		executeDataPublishing(mamState)
	        setInterval(executeDataPublishing(mamState), 15*1000);

	} else {
		console.log("exit as no correct answer");
		rl.close();
		process.exit(1);
	}
});


// Publish data to the tangle
async function publish(mamState, packet) {
    // Create MAM Payload
    const trytes = iota.utils.toTrytes(JSON.stringify(packet));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;
    console.log('Root: ', message.root);
    console.log('Address: ', message.address);

    // Attach the payload.
    await Mam.attach(message.payload, message.address);

    return message.root;
}


async function executeDataPublishing(mamState) {
    const json = {"id": "123", "time": "13.05.218", "pm2.5": "10", "pm10": "20"};
    const root = await publish(mamState, json);

    console.log(JSON.stringify(mamState));

	fs.writeFile("mamState.json", JSON.stringify(mamState), function(err, data) {
		if (err) {
                        console.log("err: " + err);
                } else {
                        console.log("data:" + JSON.stringify(data));
                }
        });

}

