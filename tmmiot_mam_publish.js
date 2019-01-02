/*
Author: Robert Lie (mobilefish.com)

The mam_publish.js file publishes random generated numbers on the tangle using MAM.
This file will work on a computer or Raspberry Pi.
The published data can be viewed using the mam_receive.js file or
https://www.mobilefish.com/services/cryptocurrency/mam.html (Select option: Data receiver)

Usage:
1)  You can change the default settings: MODE, SIDEKEY, SECURITYLEVEL or TIMEINTERVAL
    If you do, make the same changes in mam_receive.js file.
2)  Start the app: node mam_publish.js

More information:
https://www.mobilefish.com/developer/iota/iota_quickguide_raspi_mam.html
*/

const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const moment = require('moment');
const iota = new IOTA({ provider: 'https://nodes.devnet.iota.org:443' });

//PM sensor package and init
const Sensor = require('sds011-client');
const sensor = new Sensor("/dev/ttyUSB0");

//DHT sensor package and init

var fs = require('fs');

const MODE = 'restricted'; // public, private or restricted
const SIDEKEY = 'bertrand.jan@gmail.com'; // Enter only ASCII characters. Used only in restricted mode
const SECURITYLEVEL = 1; // 1, 2 or 3
const TIMEINTERVAL  = 180; // seconds

//const seed = "AECAMKYRRN9RKQWUQAPQEYODRVNNZFLRESMBIFZUZ9FEGASVDHVFBGTQAYMP9CZZDDVIUCNR9RSXEJWLU";
//const seed = undefined;




// Initialise MAM State
var mamState = Mam.init(iota, undefined,SECURITYLEVEL);

//console.log("first publish on new channel");
//Read the channel information
var mamState = JSON.parse(fs.readFileSync("mamState.json"));

// Set channel mode

if (MODE == 'restricted') {
    const key = iota.utils.toTrytes(SIDEKEY);
    mamState = Mam.changeMode(mamState, MODE, key);
} else {
    mamState = Mam.changeMode(mamState, MODE);
}

// Publish data to the tangle
const publish = async function(packet) {
    // Create MAM Payload
    const trytes = iota.utils.toTrytes(JSON.stringify(packet));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;
    console.log('Root: ', message.root);
    console.log('Address: ', message.address);
    //console.log('message: ', JSON.stringify(message))


    // Attach the payload.
    await Mam.attach(message.payload, message.address);
    
    // Write the the last state from this channel to the file
	fs.writeFile("mamState.json", JSON.stringify(mamState), function(err, data) {
    		if (err) {
    			console.log("err: " + err);
		} else {
			console.log("data:" + JSON.stringify(data));
		}
	});

    return message.root;
}

const generateJSON = function() {
    // Generate some random numbers simulating sensor data
    const data = Math.floor((Math.random()*89)+10);
    const dateTime = moment().utc().format('DD/MM/YYYY hh:mm:ss');
    const json = {"data": data, "dateTime": dateTime, "owner": "jan"};
    return json;
}

const executeDataPublishing = async function() {
    const json = generateJSON();
    console.log("json=",json);

    const root = await publish(json);
    console.log(`dateTime: ${json.dateTime}, data: ${json.data}, root: ${root}`);
}

// Start it immediately
//executeDataPublishing();

setInterval(executeDataPublishing, TIMEINTERVAL*1000);
