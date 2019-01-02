const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });

// Initialise MAM State
var mamState = Mam.init(iota, undefined, 1);

mamState = Mam.changeMode(mamState, "public");

// Publish data to the tangle
const publish = async function(packet) {
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

const executeDataPublishing = async function() {
    const json = {"id" : "12456", "date": "02.01.2019", "PM2.5" : "10", "PM10" : "5"};
    console.log("json: ", json);

    const root = await publish(json);
	console.log("root: " + roo);
}

// Start it immediately
executeDataPublishing();
