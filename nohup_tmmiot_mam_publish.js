const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });
var fs = require('fs');

//Sensor support
const rpiDhtSensor = require('rpi-dht-sensor'); //DHT sensor com package
var dht = new rpiDhtSensor.DHT22(4); //on GPIO 4

const Sensor = require('sds011-client');//PM sensor com package 
const sensor = new Sensor("/dev/ttyUSB0"); // Use your system path of SDS011 sensor.

sensor.setReportingMode('query'); //set the PM sensor to query mode
sensor.setWorkingPeriod(3); //set the interval to 3min.


//Choosing the sidekey for restricted communication
const key = iota.utils.toTrytes("tmmiot-iota-sideky");
var newChannelStarted = false;

console.log("Ok - read the latest mamState.json");
var mamState = Mam.init(iota, undefined, 1);
mamState = JSON.parse(fs.readFileSync("mamState.json"));
mamState = Mam.changeMode(mamState, "restricted", key);
executeDataPublishing(mamState)
setInterval(function() { executeDataPublishing(mamState); } , 180*1000);


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

	var readout = dht.read();

	sensor.query().then( async function(data) {
	    const json = {"id": "1", "time": Date.now(), "pm2.5": data.pm2p5, "pm10": data.pm10, "H": parseInt(readout.humidity), "T": parseInt(readout.temperature)};
	   console.log("payload :" + JSON.stringify(json));
	const root = await publish(mamState, json);

	console.log("mamState: "+ JSON.stringify(mamState));
	fs.writeFile("mamState.json", JSON.stringify(mamState), function(err, data) {
		if (err) { console.log("err: " + err); }
        });
	});
}

