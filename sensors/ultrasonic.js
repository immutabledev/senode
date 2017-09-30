var zmq = require('zmq')
  , sock = zmq.socket('pub');

sock.bindSync('tcp://127.0.0.1:3003');

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/serial0', {
  baudRate: 9600
});
const parser = port.pipe(new Readline({ delimiter: '\r' }));

var DEBUG = 0;

var distance = 255;
var datareceived = 0;

port.on('open', function(){
  parser.on('data', function(data) {
    distance = parseInt(data.substr(1,3));

    if (distance === NaN || distance < 0 || distance > 255) {
        distance = 255;
    }

    if (!datareceived) {
      datareceived = 1;
      sendDistance();
    }

    if (DEBUG) console.log(distance);
  });
});

function sendDistance() {
  if (datareceived) {
    sock.send(['distance',distance]);
    //console.log("Distance: ["+distance+"]");
  }
}

setInterval(sendDistance, 30000);
