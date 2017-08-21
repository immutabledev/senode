var i2c  = require('i2c');
var address = 0x69;
var wire = new i2c(address, {device: '/dev/i2c-1'});


var zmq = require('zmq')
  , sock = zmq.socket('pub');

sock.bindSync('tcp://127.0.0.1:3002');

function getArduinoData() {
	wire.read(9, function(err, data) {
		var f1 = new Float32Array(new Uint8Array(data.slice(0,4)).buffer)[0];
		var f2 = new Float32Array(new Uint8Array(data.slice(4,8)).buffer)[0];
		var validity = data[8];

		if (validity & 0x1) {
			sock.send(['current1',f1]);
//			console.log("Current 1: ["+f1+"]");
		}

		if (validity & 0x2) {
			sock.send(['current2',f2]);
//			console.log("Current 2: ["+f2+"]");
		}
	});
}

getArduinoData();
setInterval(getArduinoData, 30000);

