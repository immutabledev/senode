var i2c_htu21d = require('htu21d-i2c');
var htu21df = new i2c_htu21d();

var zmq = require('zmq')
  , sock = zmq.socket('pub');

sock.bindSync('tcp://127.0.0.1:3001');

function getTempHumidity() {
    htu21df.readTemperature(function (temp) {
        var t = temp*1.8 + 32.0;
        sock.send(['temperature',t]);
        //console.log('Temperature: '+t+'F');

        htu21df.readHumidity(function (humidity) {
            sock.send(['humidity',humidity]);
            //console.log('Humidity: '+humidity+'%');
        });
    });
}

getTempHumidity();
setInterval(getTempHumidity, 30000);

