var zmq = require('zmq'),
  s_therm = zmq.socket('sub'),
  s_env = zmq.socket('sub'),
  s_current = zmq.socket('sub'),
  publish = zmq.socket('pub');

var DEBUG = 0;

// Define indecies into Arrays
var TEMP1 = 0,
    TEMP2 = 1,
    TEMP3 = 2,
    TEMPERATURE = 3,
    HUMIDITY = 4,
    CURRENT1 = 5,
    CURRENT2 = 6;
var NUM_ELEMENTS = 7;

var TIMEOUT = 60;                     // After 60 seconds of stale data, a sensor value is declared invalid

var values = Array(NUM_ELEMENTS);     // String representation of data
var lastUpdate = Array(NUM_ELEMENTS); // Unix timestamp of last update received 
var validity = Array(NUM_ELEMENTS);   // True/False validity if the currently stored data is valid
var topics = ["temp1","temp2","temp3","temperature","humidity","current1","current2"];

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

s_therm.on('message', function(topic, message) {
	var temp1 = "---";
	var temp2 = "---";
	var temp3 = "---";
	var ts = Math.floor(Date.now()/1000); 

	if (DEBUG) console.log("(THERM)["+topic+"] ["+message+"]\n");
	if (topic == "temp1") {
		try {
			var temp1_i = parseFloat(message);
			if (temp1_i < 120.0 && temp1_i > -30.0) {
				temp1 = temp1_i.toString();
			} else {
				temp1 = "---";
			} 
		} catch(e) {
			temp1 = "---";
		}
		values[TEMP1] = temp1;
		lastUpdate[TEMP1] = ts;
		sendToDisplay("temp1",temp1,1);
	} else if (topic == "temp2") {
		try {
                        var temp2_i = parseFloat(message);
                        if (temp2_i < 120.0 && temp2_i > -30.0) {
                                temp2 = temp2_i.toString();
                        } else {
                                temp2 = "---";
                        }
                } catch(e) {
                        temp2 = "---";
                }
                values[TEMP2] = temp2;
		lastUpdate[TEMP2] = ts;
		sendToDisplay("temp2",temp2,1);
	} else if (topic == "temp3") {
		try {
                        var temp3_i = parseFloat(message);
                        if (temp3_i < 120.0 && temp3_i > -30.0) {
                                temp3 = temp3_i.toString();
                        } else {
                                temp3 = "---";
                        }
                } catch(e) {
                        temp3 = "---";
                }
                values[TEMP3] = temp3;
		lastUpdate[TEMP3] = ts;
		sendToDisplay("temp3",temp3,1);
	}

});

s_env.on('message', function(topic, message) {
        if (DEBUG) console.log("(ENV)["+topic+"] ["+message+"]\n");

	var temp = "---";
	var humidity = "---";
	var ts = Math.floor(Date.now()/1000);

	if (topic == "temperature") {
		try {
			var t_i = parseFloat(message);
			if (t_i < 130.0 && t_i > -20.0) {
				temp = t_i.toString();
			}
		} catch(e) { }
		values[TEMPERATURE] = temp;
		lastUpdate[TEMPERATURE] = ts;
		sendToDisplay("temperature",temp,1);
	} else if (topic == "humidity") {
		try {
                        var h_i = parseFloat(message);
                        if (h_i <= 100.0 && h_i >= 0.0) {
                                humidity = h_i.toString();
                        }
                } catch(e) { }  
                values[HUMIDITY] = humidity;
                lastUpdate[HUMIDITY] = ts;
                sendToDisplay("humidity",humidity,1);
	}
});

s_current.on('message', function(topic, message) {
        if (DEBUG) console.log("(CURRENT)["+topic+"] ["+message+"]\n");

	var current1 = "---";
        var current2 = "---";
        var ts = Math.floor(Date.now()/1000);

        if (topic == "current1") {
                try {
                        var c1_i = parseFloat(message);
                        if (c1_i <= 10.0 && c1_i >= 0.0) {
                                current1 = c1_i.toString();
                        }
                } catch(e) { }
                values[CURRENT1] = current1;
                lastUpdate[CURRENT1] = ts;
                sendToDisplay("current1",current1,1);
        } else if (topic == "current2") {
                try {
                        var c2_i = parseFloat(message);
                        if (c2_i <= 10.0 && c2_i >= 0.0) {
                                current2 = c2_i.toString();
                        }
                } catch(e) { }
                values[CURRENT2] = current2;
                lastUpdate[CURRENT2] = ts;
                sendToDisplay("current2",current2,1);
        }
});

function determineValidity() {
	var current = Math.floor(Date.now()/1000);

	for(var i=0; i<NUM_ELEMENTS; i++) {
		if ((current-lastUpdate[i]) > TIMEOUT) {
			console.log("["+i+"] ["+current+"]["+lastUpdate[i]+"]");
			validity[i] = 0;
			sendToDisplay(topics[i], values[i], 0);
		} else {
			validity[i] = 1;
		}
	}
}

function heartBeat() {
	sendToDisplay("heartbeat", status);
}

function sendToDisplay(topic, message, validity) {
	if (DEBUG) console.log("sendToDisplay("+topic+","+message+" "+validity+")");
	publish.send(topic+" "+message+" "+validity);
}

setInterval(heartBeat, 20000);  // Send a heartbeat message every 20 sec

setInterval(determineValidity, TIMEOUT*1000); 
