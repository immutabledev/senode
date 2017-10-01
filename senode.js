var zmq = require('zmq'),
  s_therm = zmq.socket('sub'),
  s_env = zmq.socket('sub'),
  s_current = zmq.socket('sub'),
  s_distance = zmq.socket('sub'),
  publish = zmq.socket('pub');

var DEBUG = 0;

const DISTANCE_LOW = 8;
const DISTANCE_HIGH = 16;

// Define indecies into Arrays
var TEMP1 = 0,
    TEMP2 = 1,
    TEMP3 = 2,
    TEMPERATURE = 3,
    HUMIDITY = 4,
    CURRENT1 = 5,
    CURRENT2 = 6,
    DISTANCE = 7;
var NUM_ELEMENTS = 8;

var TIMEOUT = 60;                     // After 60 seconds of stale data, a sensor value is declared invalid

var values = Array(NUM_ELEMENTS);     // String representation of data
var lastUpdate = Array(NUM_ELEMENTS); // Unix timestamp of last update received 
var validity = Array(NUM_ELEMENTS);   // True/False validity if the currently stored data is valid
var topics = ["temp1","temp2","temp3","temperature","humidity","current1","current2","distance"];

var status = 0;                       // Overall status of the system; 0=no issues

// Initialize Arrays
for(var i=0; i<NUM_ELEMENTS; i++) {
	values[i] = "---";
	lastUpdate[i] = 0;
	validity[i] = 0;
}

publish.bindSync('tcp://127.0.0.1:4000');
 
s_therm.connect('tcp://127.0.0.1:3000');
s_therm.subscribe('temp1');
s_therm.subscribe('temp2');
s_therm.subscribe('temp3');

s_env.connect('tcp://127.0.0.1:3001');
s_env.subscribe('temperature');
s_env.subscribe('humidity');

s_current.connect('tcp://127.0.0.1:3002');
s_current.subscribe('current1');
s_current.subscribe('current2');

s_distance.connect('tcp://127.0.0.1:3003');
s_distance.subscribe('distance');

s_therm.on('message', function(topic, message) {
	var temp1 = "---";
	var temp2 = "---";
	var temp3 = "---";

	if (DEBUG) console.log("(THERM)["+topic+"] ["+message+"]\n");
	if (topic == "temp1") {
		try {
			var temp1_i = parseFloat(message).toFixed(1);
			if (temp1_i < 120.0 && temp1_i > -30.0) {
				temp1 = temp1_i.toString();
			} else {
				temp1 = "---";
			} 
		} catch(e) {
			temp1 = "---";
		}
		updateData(TEMP1, temp1);
	} else if (topic == "temp2") {
		try {
                        var temp2_i = parseFloat(message).toFixed(1);
                        if (temp2_i < 120.0 && temp2_i > -30.0) {
                                temp2 = temp2_i.toString();
                        } else {
                                temp2 = "---";
                        }
                } catch(e) {
                        temp2 = "---";
                }
		updateData(TEMP2, temp2);
	} else if (topic == "temp3") {
		try {
                        var temp3_i = parseFloat(message).toFixed(1);
                        if (temp3_i < 120.0 && temp3_i > -30.0) {
                                temp3 = temp3_i.toString();
                        } else {
                                temp3 = "---";
                        }
                } catch(e) {
                        temp3 = "---";
                }
		updateData(TEMP3, temp3);
	}

});

s_env.on('message', function(topic, message) {
        if (DEBUG) console.log("(ENV)["+topic+"] ["+message+"]\n");

	var temp = "---";
	var humidity = "---";

	if (topic == "temperature") {
		try {
			var t_i = parseFloat(message).toFixed(1);
			if (t_i < 130.0 && t_i > -20.0) {
				temp = t_i.toString();
			}
		} catch(e) { }
		updateData(TEMPERATURE, temp);
	} else if (topic == "humidity") {
		try {
                        var h_i = parseFloat(message).toFixed(1);
                        if (h_i <= 100.0 && h_i >= 0.0) {
                                humidity = h_i.toString();
                        }
                } catch(e) { }  
		updateData(HUMIDITY, humidity);
	}
});

s_current.on('message', function(topic, message) {
        if (DEBUG) console.log("(CURRENT)["+topic+"] ["+message+"]\n");

	var current1 = "---";
        var current2 = "---";

        if (topic == "current1") {
                try {
                        var c1_i = parseFloat(message).toFixed(1);
                        if (c1_i < 10.0 && c1_i >= 0.0) {
                                current1 = c1_i.toString();
                        }
                } catch(e) { }
		updateData(CURRENT1, current1);
        } else if (topic == "current2") {
                try {
                        var c2_i = parseFloat(message).toFixed(1);
                        if (c2_i <= 10.0 && c2_i >= 0.0) {
                                current2 = c2_i.toString();
                        }
                } catch(e) { }
		updateData(CURRENT2, current2);
        }
});

s_distance.on('message', function(topic, message) {
        if (DEBUG) console.log("(DISTANCE)["+topic+"] ["+message+"]\n");

	var distance = "---";

	if (topic == "distance") {
		var d = parseInt(message);
console.log("DISTANCE: ["+d+"]");
		if (d >= DISTANCE_LOW && d <= DISTANCE_HIGH) {
			var p = 100 - ((d - DISTANCE_LOW) * 100) / (DISTANCE_HIGH - DISTANCE_LOW);
			distance = Math.round(p).toString();
console.log("["+distance+"%]");
		} else {
			distance = "---";
		}
	
		updateData(DISTANCE, distance);
	}
});

function updateData(index, data) {
	values[index] = data;
	lastUpdate[index] = Math.floor(Date.now()/1000);
	sendToDisplay(topics[index], data, 1);

}

function determineValidity() {
	var current = Math.floor(Date.now()/1000);

	for(var i=0; i<NUM_ELEMENTS; i++) {
		if ((current-lastUpdate[i]) > TIMEOUT) {
			if (DEBUG) console.log("["+i+"] ["+current+"]["+lastUpdate[i]+"]");
			validity[i] = 0;
			sendToDisplay(topics[i], values[i], 0);
		} else {
			validity[i] = 1;
		}
	}
}

function heartBeat() {
	sendToDisplay("heartbeat", status, 1);
}

function sendToDisplay(topic, message, validity) {
	if (DEBUG) console.log("sendToDisplay("+topic+","+message+" "+validity+")");
	//publish.send([topic,message+" "+validity]);
	publish.send(topic+" "+message+" "+validity);
}

setInterval(heartBeat, 20000);  // Send a heartbeat message every 20 sec

setInterval(determineValidity, TIMEOUT*1000); 
