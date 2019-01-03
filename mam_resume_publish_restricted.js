const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });
var fs = require('fs');

//Choosing the sidekey for restricted communication
const key = iota.utils.toTrytes("tmmiot-iota-sideky");
var newChannelStarted = false;

var readline = require('readline');
var rl = readline.createInterface( {
	input: process.stdin, 
	output: process.stdout
});

rl.question("Do you like to start a new channel (y/n)=", function(answer)  {
	if (answer === "y") {
		rl.close();
            newChannelStarted = true;
	        var mamState = Mam.init(iota, undefined, 1);
        	mamState = Mam.changeMode(mamState, "restricted", key);
		    console.log("Ok - start over again");
		    //save the root of the channel
		executeDataPublishing(mamState)
	    	setInterval(function() { executeDataPublishing(mamState); } , 15*1000);
	} else if (answer ==="n") {
		rl.close();
		console.log("Ok - read the latest mamState.json");
	        var mamState = Mam.init(iota, undefined, 1);
		mamState = JSON.parse(fs.readFileSync("mamState.json"));
		mamState = Mam.changeMode(mamState, "restricted", key);
		executeDataPublishing(mamState)
	    setInterval(function() { executeDataPublishing(mamState); } , 15*1000);

	} else {
		console.log("Exit - please answer with y or n");
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
    if (newChannelStarted == true) {
        fs.writeFile("mamChannelRoot.json", JSON.stringify(mamState), function(err, data) {
			if (err) { console.log("error: "+ err)}
		});
        newChannelStarted = false;
    }
    console.log('Root: ', message.root);
    // Attach the payload.
    await Mam.attach(message.payload, message.address);

    return message.root;
}


async function executeDataPublishing(mamState) {
    const json = {"id": "123", "time": "13.05.218", "pm2.5": "10", "pm10": "20"};
    const root = await publish(mamState, json);

    console.log("mamState: "+ JSON.stringify(mamState));

	fs.writeFile("mamState.json", JSON.stringify(mamState), function(err, data) {
		if (err) { console.log("err: " + err); }
        });
}

