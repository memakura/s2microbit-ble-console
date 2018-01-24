"use strict";
// https://github.com/sandeepmistry/node-bbc-microbit/blob/master/API.md

var BBCMicrobit = require('bbc-microbit');
var device = null;
var microbitConnected = false;

var BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

var debug = false;

var useButtons = true;
var useTemperature = true;
var useAccelerometer = true;
var useMagnetometer = false;

//--- from scratch_microbit.js
var buttonState = null;
var matrixState = null;
var pinValue = null;
var pinSetup = null;
var temperature = null;
var magnetometerBearing = null;
var magnetometer = null;
var accelerometer = null;
var deviceName = null;

function initValues () {
  console.log("Initialize values...");
  buttonState = {A: 0, B: 0};
  matrixState = [0, 0, 0, 0, 0];
  // The array has space for P0 to P20 (including P17 and P18).
  pinValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  pinSetup = [
    false, false, false, false, false, false, false, false, false, false, false,
    false, false, false, false, false, false, false, false, false, false
  ];
  temperature = 0;
  magnetometerBearing = 0;
  magnetometer = { 'x': 0, 'y': 0, 'z': 0 };
  accelerometer = { 'x': 0, 'y': 0, 'z': 0 };
}

initValues();

// Discover microbit
console.log("=== BBC micro:bit Scratch 2.0 offline extension ===");

//var id = 'dd628ee75dfe';
var id = 'd5a250cd6035';
function microbitScanner() {
  console.log('microbit: scanning...');
  BBCMicrobit.discoverAll(onDiscover); // find all microbits

  BBCMicrobit.discoverById(id, microbitFound);
  //BBCMicrobit.discover(microbitFound);
}

function onDiscover(microbit) {
  console.log("  found microbit : " + microbit);
}

microbitScanner();

// ================= HTTP server =======================
var express = require('express');
var exapp = express();
let exserver = null;

function startHTTPServer(){
  exserver = exapp.listen(50209, function(){
    console.log("Server started... listening port " + exserver.address().port);
  });
}

//--- Responses to HTTP requrests from Scratch 2.0
exapp.get('/scroll/:text', function(req, res) {
  if (device) {
    // text is a string that must be 20 characters or less
    var txt = req.params.text.substring(0, 20);
    device.writeLedText(txt, function(error) {
      console.log('microbit: display %s', txt);
    });
  }
  res.send("OK");
});

// 未完成
/*
exapp.get('/display_image/:value', function(req, res) {
  if (device) {
    matrix = new Buffer(value, 'hex');
    device.writeLedMatrixState(matrix);
  }
});
exapp.get('/...')
  if (device) {
    device.writePin(data.pin, Math.min(data.value, 255), function(error) {
      // console.log('microbit: < pin %d, value %d', data.pin, data.value);
    });
  };
});
*/
//
exapp.get('/poll', function(req, res) {
  var reply = "";
  reply += "button_a_pressed " + (buttonState['A']!=0) + "\n";
  reply += "button_b_pressed " + (buttonState['B']!=0) + "\n";
  reply += "temperature " + temperature + "\n";
  reply += "magBearing " + magnetometerBearing + "\n";
  reply += "mag_x " + magnetometer['x'] + "\n";
  reply += "mag_y " + magnetometer['y'] + "\n";
  reply += "mag_z " + magnetometer['z'] + "\n";
  reply += "acc_x " + accelerometer['x'] + "\n";
  reply += "acc_y " + accelerometer['y'] + "\n";
  reply += "acc_z " + accelerometer['z'] + "\n";
  res.send(reply);
  if (debug) { console.log(reply); }
});
// =============================================================

// Callback when discovered
function microbitFound(microbit) {
  console.log('microbit: discovered %s', microbit); // microbit.id, microbit.address

  // Events from microbit
  microbit.on('disconnect', function() {
    microbitConnected = false;
    device = null;
    console.log('microbit: disconnected ' + microbitConnected);
    microbitScanner();
  });

  microbit.on('buttonAChange', function(value) {
    if (debug) { console.log('microbit: button A', BUTTON_VALUE_MAPPER[value]); }
    buttonState['A']= value;
  });

  microbit.on('buttonBChange', function(value) {
    if (debug) { console.log('microbit: button B', BUTTON_VALUE_MAPPER[value]); }
    buttonState['B']= value;
  });

  microbit.on('pinDataChange', function(pin, value) {
    if (debug) { console.log('microbit: > pin %d, value %d', pin, value); }
    pinValue[pin] = value;
  });

  microbit.on('temperatureChange', function(value) {
    if (debug) { console.log('microbit: temperature %d', value); }
    temperature = value;
  });

  microbit.on('magnetometerBearingChange', function(value) {
    console.log('microbit: magnetometer bearing %d', value);
    if (debug) { console.log('microbit: magnetometer bearing %d', value); }
    magnetometerBearing = value;
  });

  microbit.on('magnetometerChange', function(x, y, z) {
    // console.log('microbit: orig magnetometer %d, %d, %d', x, y, z);
    x = x.toFixed(1);
    y = y.toFixed(1);
    z = z.toFixed(1);
    //if (debug) { console.log('microbit: magnetometer %d, %d, %d', x, y, z); }
    magnetometer = { 'x': x, 'y': y, 'z': z };
  });

  microbit.on('accelerometerChange', function(x, y, z) {
    // console.log('microbit: orig accelerometer %d, %d, %d', x, y, z);    
    x = x.toFixed(1);
    y = y.toFixed(1);
    z = z.toFixed(1);
    //if (debug) { console.log('microbit: accelerometer %d, %d, %d', x, y, z); }
    accelerometer = { 'x': x, 'y': y, 'z': z };
  });

  // When connected
  console.log('microbit: connecting...');
  microbit.connectAndSetUp(function() {
    microbitConnected = true;
    device = microbit;
    console.log('microbit: connected ' + microbitConnected);

    if (useButtons) {
      microbit.subscribeButtons(function(error) {
        console.log('microbit: subscribed to buttons');
      });
    }
    if (useTemperature) {
      microbit.writeTemperaturePeriod(1000, function() {
        microbit.subscribeTemperature(function(error) {
          console.log('microbit: subscribed to temperature');
        });
      });
    }
    if (useMagnetometer) {
      microbit.writeMagnetometerPeriod(160, function() {
        // Use either of Bearing or XYZ 
        /*
        microbit.subscribeMagnetometerBearing(function(error) {
          console.log('microbit: subscribed to magnetometer bearing');
        });
        */
        microbit.subscribeMagnetometer(function(error) {
          console.log('microbit: subscribed to magnetometer');
        });
      });
    }
    if (useAccelerometer) {
      microbit.writeAccelerometerPeriod(160, function() {
        microbit.subscribeAccelerometer(function(error) {
          console.log('microbit: subscribed to accelerometer');
        });
      });
    }

    microbit.readDeviceName(function(error, deviceName) {
      console.log('microbit: ' + deviceName);
      deviceName = devicename;
    });

    if (exserver === null) {
      startHTTPServer();
    }
  });
}

/*
//  socket.on('pinSetup', function(data) {
  // console.log('socket: pinSetup');
  if (device) {
    function log(data) {
      console.log('microbit: setup pin %d as %s %s',
        data.pin, data.ADmode, data.IOmode);
    }

    function subscribe(device, data) {
      device.subscribePinData(function(error) {
        log(data);
        // It will trigger a pinDataChange.
        device.readPin(data.pin, function(error, value) {
        });
      });
    };

    if (data.IOmode == 'input') {
      device.pinInput(data.pin, function(error) {
        if (data.ADmode == 'analog') {
          device.pinAnalog(data.pin, function(error) {
            subscribe(device, data);
          });
        } else {
          device.pinDigital(data.pin, function(error) {
            subscribe(device, data);
          });
        };
      });
    } else {
      device.pinOutput(data.pin, function(error) {
        if (data.ADmode == 'analog') {
          device.pinAnalog(data.pin, function(error) {
            log(data);
          });
        } else {
          device.pinDigital(data.pin, function(error) {
            log(data);
          });
        };
      });
    };
  };
//  });

//  socket.on('inWrite', function(data) {
*/

