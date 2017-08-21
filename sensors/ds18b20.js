var ds18b20 = require('ds18b20');
var zmq = require('zmq')
  , sock = zmq.socket('pub');

sock.bindSync('tcp://127.0.0.1:3000');

function getTemperatures() {
  ds18b20.temperature('28-00042b31f0ff', function(err, value) {
    var temp1 = value*1.8 + 32.0;
    sock.send(['temp1',temp1]);
//    console.log('['+Date.now()+'] Temp 1: '+temp1);
  });

  ds18b20.temperature('28-00042e0895ff', function(err, value) {
    var temp2 = value*1.8 + 32.0;
    sock.send(['temp2',temp2]);
//    console.log('['+Date.now()+'] Temp 2: '+temp2);
  });

  ds18b20.temperature('28-00042e0848ff', function(err, value) {
    var temp3 = value*1.8 + 32.0;
    sock.send(['temp3',temp3]);
//    console.log('['+Date.now()+'] Temp 3: '+temp3);
  });
}

getTemperatures();
setInterval(getTemperatures, 30000);

